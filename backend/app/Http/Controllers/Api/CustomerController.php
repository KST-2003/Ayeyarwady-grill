<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Payment;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    // GET /api/customers/me/stats — customer's own dashboard stat cards
    public function stats(Request $request)
    {
        $customer = $request->user();

        $totalVisits = Booking::where('customer_id', $customer->id)->count();

        // Only booking deposits are tied to a real payment status today —
        // orders don't create Payment rows yet (see README "Scope
        // simplifications"), so this reflects verified deposits only.
        $totalSpent = Payment::where('status', 'PAID')
            ->whereHas('booking', fn ($q) => $q->where('customer_id', $customer->id))
            ->sum('amount');

        return response()->json([
            'totalVisits' => $totalVisits,
            'totalSpent' => (float) $totalSpent,
            'memberSince' => $customer->registration_date,
        ]);
    }

    // GET /api/customers — admin only: every customer with visit / spend stats.
    //
    // A "visit" is a distinct calendar day on which the customer had a
    // confirmed/completed booking or placed an order that wasn't cancelled.
    // Spend = non-cancelled order totals + verified (PAID) booking deposits.
    public function index()
    {
        $customers = Customer::with([
            'bookings' => fn ($q) => $q->with(['payments' => fn ($p) => $p->where('status', 'PAID')]),
            'orders',
        ])->orderBy('name')->get();

        $rows = $customers->map(function (Customer $c) {
            $bookings = $c->bookings->whereIn('status', ['CONFIRMED', 'COMPLETED']);
            $orders = $c->orders->where('status', '!=', 'CANCELLED');

            // toBase(): these are date strings, not models. An empty Eloquent
            // collection (no bookings) would otherwise stay Eloquent after
            // merge() and unique() would call getKey() on the strings.
            $visitDates = $bookings->map(fn ($b) => $b->booking_date->toDateString())->toBase()
                ->merge($orders->map(fn ($o) => $o->created_at->toDateString())->toBase())
                ->unique()
                ->sortDesc()
                ->values();

            $spent = (float) $orders->sum('total_amount')
                + (float) $c->bookings->flatMap->payments->sum('amount');

            return [
                'id' => $c->id,
                'name' => $c->name,
                'email' => $c->email,
                'phone' => $c->phone,
                'registrationDate' => $c->registration_date,
                'isActive' => $c->is_active,
                'visitCount' => $visitDates->count(),
                'bookingCount' => $c->bookings->count(),
                'orderCount' => $orders->count(),
                'totalSpent' => $spent,
                'lastVisit' => $visitDates->first(),
                'visitDates' => $visitDates->take(30)->all(),
            ];
        });

        return response()->json($rows->values());
    }

    // GET /api/customers/{id}/orders — admin only: one customer's order history,
    // newest first. Only orders placed while logged in carry a customer_id;
    // guest QR orders can't be attributed to anyone.
    public function orders($id)
    {
        $customer = Customer::findOrFail($id);

        $orders = Order::where('customer_id', $customer->id)
            ->with(['items.item', 'table'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($orders);
    }

    // PATCH /api/customers/{id} — admin only: fix contact details, reset
    // email / password, or deactivate. Changing email or password signs the
    // customer out everywhere.
    public function update(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email', Rule::unique('customers', 'email')->ignore($customer->id)],
            'phone' => 'sometimes|nullable|string|max:50',
            'password' => 'sometimes|required|string|min:6',
            'isActive' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $oldValue = $customer->toArray();

        $data = $request->only(['name', 'email', 'phone']);
        if ($request->has('isActive')) {
            $data['is_active'] = $request->boolean('isActive');
        }
        $credentialsChanged = $request->has('email') && $request->input('email') !== $customer->email;
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->input('password'));
            $credentialsChanged = true;
        }

        $customer->update($data);

        if ($credentialsChanged) {
            $customer->tokens()->delete();
        }

        AuditLogger::record($request, 'update', 'customers', $customer->id, $oldValue, $customer->toArray());

        return response()->json($customer);
    }
}
