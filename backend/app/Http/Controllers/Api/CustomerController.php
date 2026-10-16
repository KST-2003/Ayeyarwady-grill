<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Payment;
use Illuminate\Http\Request;

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

            $visitDates = $bookings->map(fn ($b) => $b->booking_date->toDateString())
                ->merge($orders->map(fn ($o) => $o->created_at->toDateString()))
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
}
