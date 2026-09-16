<?php

namespace App\Http\Controllers\Api;

use App\Events\OrderCreated;
use App\Events\OrderStatusChanged;
use App\Events\TableStatusChanged;
use App\Http\Controllers\Controller;
use App\Models\DiningTable;
use App\Models\MenuItem;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderStatusLog;
use App\Support\SafeBroadcast;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OrderController extends Controller
{
    // POST /api/orders — used by BOTH the QR ordering page (customer,
    // dine-in, possibly a guest with no account) and staff (walk-in orders
    // taken on behalf of a table). Auth is optional here — see routes/api.php,
    // this route sits outside the auth:sanctum group and instead resolves
    // the user manually via the bearer token if one is present.
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tableId' => 'required|exists:dining_tables,id',
            'items' => 'required|array|min:1',
            'items.*.itemId' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.itemNote' => 'nullable|string',
            'specialInstructions' => 'nullable|string',
            'isWalkin' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $user = $request->user(); // resolved by the optional bearer-token check in routes

        $customerId = $user && $user->roleType === 'CUSTOMER' ? $user->id : null;
        $staffId = $user && $user->roleType === 'STAFF' ? $user->id : null; // Admin id doesn't belong in staff_id, see BookingController note

        $items = $request->input('items');
        $menuItems = MenuItem::whereIn('id', collect($items)->pluck('itemId'))->get()->keyBy('id');

        $totalAmount = collect($items)->reduce(function ($sum, $line) use ($menuItems) {
            $menuItem = $menuItems->get($line['itemId']);
            return $sum + ($menuItem ? $menuItem->price * $line['quantity'] : 0);
        }, 0);

        $order = Order::create([
            'table_id' => $request->input('tableId'),
            'customer_id' => $customerId,
            'staff_id' => $staffId,
            'is_walkin' => $request->boolean('isWalkin'),
            'special_instructions' => $request->input('specialInstructions'),
            'total_amount' => $totalAmount,
        ]);

        foreach ($items as $line) {
            $menuItem = $menuItems->get($line['itemId']);
            $order->items()->create([
                'item_id' => $line['itemId'],
                'quantity' => $line['quantity'],
                'unit_price' => $menuItem->price,
                'item_note' => $line['itemNote'] ?? null,
            ]);
        }

        // Placing an order always claims the table, regardless of whether
        // it was AVAILABLE (walk-in) or RESERVED (customer scanned first).
        $table = DiningTable::find($request->input('tableId'));
        if ($table) {
            $table->update(['status' => 'OCCUPIED']);
            SafeBroadcast::send(new TableStatusChanged($table));
        }

        $order->load(['items.item.images', 'table']);

        SafeBroadcast::send(new OrderCreated($order));

        return response()->json($order, 201);
    }

    // GET /api/orders/live — staff/admin: orders not yet completed
    public function live()
    {
        $orders = Order::whereNotIn('status', ['COMPLETED', 'CANCELLED'])
            ->with(['items.item.images', 'table', 'customer'])
            ->orderBy('created_at')
            ->get();

        return response()->json($orders);
    }

    // GET /api/orders/mine — customer order history
    public function mine(Request $request)
    {
        $orders = Order::where('customer_id', $request->user()->id)
            ->with(['items.item.images', 'table'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($orders);
    }

    // GET /api/orders/by-table/{tableId} — the QR ordering page's own order
    // history: a dine-in guest may place several orders in one visit (add
    // a round, then another) without ever logging in, so there's no
    // customer_id to key off like /orders/mine does. The frontend tracks
    // which order ids it placed for this table in this browser (localStorage)
    // and passes them here to refresh their live status; we scope strictly
    // to that table + those ids rather than returning the table's full
    // history, so one guest's session can't see a previous diner's orders.
    public function byTable(Request $request, $tableId)
    {
        $ids = collect(explode(',', (string) $request->query('ids', '')))
            ->filter()
            ->values();

        $orders = Order::where('table_id', $tableId)
            ->whereIn('id', $ids)
            ->with(['items.item.images', 'table'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($orders);
    }

    // PATCH /api/orders/{id}/status — staff/admin updates order progress
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:PLACED,PREPARING,READY,SERVED,COMPLETED,CANCELLED',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $order = Order::findOrFail($id);
        $oldStatus = $order->status;
        $newStatus = $request->input('status');
        $user = $request->user();

        $order->update(['status' => $newStatus]);

        OrderStatusLog::create([
            'order_id' => $order->id,
            'staff_id' => $user->roleType === 'STAFF' ? $user->id : null,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'changed_at' => now(),
        ]);

        if ($order->customer_id) {
            Notification::create([
                'order_id' => $order->id,
                'customer_id' => $order->customer_id,
                'message' => 'Your order is now '.strtolower($newStatus).'.',
                'type' => 'ORDER_UPDATE',
            ]);
        }

        $order->load(['items.item.images', 'table']);

        SafeBroadcast::send(new OrderStatusChanged($order));

        return response()->json($order);
    }
}
