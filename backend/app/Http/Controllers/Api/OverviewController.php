<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Staff;

class OverviewController extends Controller
{
    // GET /api/overview — staff/admin dashboard stat cards
    public function index()
    {
        return response()->json([
            'pendingPayments' => Payment::whereNotNull('booking_id')->where('status', 'PENDING')->count(),
            'todayBookings' => Booking::whereDate('booking_date', now()->toDateString())->count(),
            'liveOrders' => Order::whereNotIn('status', ['COMPLETED', 'CANCELLED'])->count(),
            'occupiedTables' => DiningTable::where('status', 'OCCUPIED')->count(),
            'totalTables' => DiningTable::count(),
            'totalStaff' => Staff::where('is_active', true)->count(),
        ]);
    }
}
