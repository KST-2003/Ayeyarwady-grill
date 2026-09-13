<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
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
}
