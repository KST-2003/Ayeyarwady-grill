<?php

namespace App\Http\Controllers\Api;

use App\Events\BillRequested;
use App\Events\OrderStatusChanged;
use App\Events\TableStatusChanged;
use App\Http\Controllers\Controller;
use App\Models\DiningTable;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderStatusLog;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Support\SafeBroadcast;
use App\Support\TableBill;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class BillController extends Controller
{
    // The QR page proves it is at the table the same way ordering does: with
    // the table's QR token. Returns the table, or null for a bad code.
    private function tableFromQr(Request $request): ?DiningTable
    {
        $table = DiningTable::where('table_number', $request->input('table'))->with('qrCode')->first();

        if (! $table || ! $table->qrCode || ! $table->qrCode->is_active
            || $table->qrCode->token !== $request->input('token')) {
            return null;
        }

        return $table;
    }

    // GET /api/tables/bill?table=&token= — public: the diner's receipt, if
    // they already asked for it (so a reload keeps showing it).
    public function show(Request $request)
    {
        $table = $this->tableFromQr($request);
        if (! $table) {
            return response()->json(['error' => 'Invalid or expired QR code'], 404);
        }

        return response()->json(['bill' => TableBill::receipt($table)]);
    }

    // POST /api/tables/check-bill {table, token} — public: the diner is done.
    // Marks the table's unpaid orders as billed, flips the table to
    // NEEDS_CLEANING and tells the floor to collect money. Asking twice
    // simply returns the same bill.
    public function request(Request $request)
    {
        $table = $this->tableFromQr($request);
        if (! $table) {
            return response()->json(['error' => 'Invalid or expired QR code'], 404);
        }

        $newlyBilled = TableBill::billable($table->id)->get();

        if ($newlyBilled->isEmpty() && ! TableBill::receipt($table)) {
            return response()->json(['error' => 'There is nothing to pay for yet — place an order first.'], 422);
        }

        if ($newlyBilled->isNotEmpty()) {
            Order::whereIn('id', $newlyBilled->pluck('id'))->update(['bill_requested_at' => now()]);
            $table->update(['status' => 'NEEDS_CLEANING']);

            $receipt = TableBill::receipt($table);

            Notification::create([
                'order_id' => $newlyBilled->first()->id,
                'message' => "Table {$table->table_number} asked for the bill — ".number_format($receipt['total']).' MMK.',
                'type' => 'BILL_REQUESTED',
            ]);

            SafeBroadcast::send(new TableStatusChanged($table));
            BillRequested::dispatch($table, $receipt['total']);
        }

        return response()->json(['bill' => TableBill::receipt($table)]);
    }

    // GET /api/tables/{id}/bill — staff/admin: the cashier's view.
    public function showForStaff($id)
    {
        $table = DiningTable::findOrFail($id);

        return response()->json([
            'bill' => TableBill::receipt($table),
            'methods' => PaymentMethod::where('is_active', true)->orderBy('method_name')->get(['id', 'method_name']),
        ]);
    }

    // POST /api/tables/{id}/bill/pay {methodId} — staff/admin confirms the
    // money was collected. Records one PAID payment per order, completes the
    // orders and leaves the table NEEDS_CLEANING for the floor to reset.
    public function pay(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'methodId' => 'required|exists:payment_methods,id',
        ]);
        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $table = DiningTable::findOrFail($id);
        $user = $request->user();

        $orders = DB::transaction(function () use ($table, $request, $user) {
            // Lock so two cashiers tapping at once can't both record the payment.
            $orders = TableBill::pending($table->id)->lockForUpdate()->get();

            foreach ($orders as $order) {
                Payment::create([
                    'order_id' => $order->id,
                    'method_id' => $request->input('methodId'),
                    'amount' => $order->total_amount,
                    'payment_date' => now(),
                    'status' => 'PAID',
                ]);

                if ($order->status !== 'COMPLETED') {
                    OrderStatusLog::create([
                        'order_id' => $order->id,
                        'staff_id' => $user->roleType === 'STAFF' ? $user->id : null,
                        'old_status' => $order->status,
                        'new_status' => 'COMPLETED',
                        'changed_at' => now(),
                    ]);
                    $order->update(['status' => 'COMPLETED']);
                }
            }

            $table->update(['status' => 'NEEDS_CLEANING']);

            return $orders;
        });

        if ($orders->isEmpty()) {
            return response()->json(['error' => 'This table has no bill waiting to be paid.'], 409);
        }

        foreach ($orders as $order) {
            if ($order->customer_id) {
                Notification::create([
                    'order_id' => $order->id,
                    'customer_id' => $order->customer_id,
                    'message' => 'Payment received — thank you for dining with us!',
                    'type' => 'ORDER_UPDATE',
                ]);
            }
            SafeBroadcast::send(new OrderStatusChanged($order->load(['items.item.images', 'table'])));
        }
        SafeBroadcast::send(new TableStatusChanged($table));

        return response()->json([
            'paid' => true,
            'tableNumber' => $table->table_number,
            'total' => (float) $orders->sum('total_amount'),
        ]);
    }

    // GET /api/payments/orders — staff/admin: money collected at the counter,
    // newest first, one row per table visit (orders paid together are one row).
    public function collected()
    {
        $rows = Payment::whereNotNull('order_id')
            ->where('status', 'PAID')
            ->with(['method', 'order.table'])
            ->orderByDesc('payment_date')
            ->limit(500)
            ->get()
            ->groupBy(fn ($p) => $p->order->table_id.'|'.$p->method_id.'|'.$p->payment_date->format('Y-m-d H:i'))
            ->map(fn ($group) => [
                'paidAt' => $group->first()->payment_date,
                'tableNumber' => $group->first()->order->table?->table_number,
                'method' => $group->first()->method?->method_name,
                'orderIds' => $group->pluck('order_id')->values()->all(),
                'amount' => (float) $group->sum('amount'),
            ])
            ->values();

        return response()->json($rows);
    }
}
