<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Staff;

class OverviewController extends Controller
{
    // Every order status, in the order they actually progress through —
    // used to make sure the status-breakdown chart always shows all six
    // bars (zero-filled), not just whichever statuses happened to occur.
    const ORDER_STATUSES = ['PLACED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'];

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

    // GET /api/overview/analytics — staff/admin dashboard charts
    public function analytics()
    {
        return response()->json([
            'revenueByDay' => $this->revenueByDay(14),
            'bookingsByDay' => $this->bookingsByDay(14),
            'topMenuItems' => $this->topMenuItems(30, 5),
            'orderStatusToday' => $this->orderStatusToday(),
            'paymentMethodShare' => $this->paymentMethodShare(30),
        ]);
    }

    // Orders placed + revenue booked per day, oldest to newest, zero-filled
    // for days with no orders so the chart's x-axis never has a gap.
    private function revenueByDay(int $days): array
    {
        $since = now()->subDays($days - 1)->startOfDay();

        $rows = Order::where('created_at', '>=', $since)
            ->selectRaw('DATE(created_at) as day, COUNT(*) as orders, SUM(total_amount) as revenue')
            ->groupByRaw('DATE(created_at)')
            ->get()
            ->keyBy(fn ($r) => $r->day);

        return collect(range($days - 1, 0))->map(function ($daysAgo) use ($rows) {
            $date = now()->subDays($daysAgo)->toDateString();
            $row = $rows->get($date);

            return [
                'date' => $date,
                'orders' => $row ? (int) $row->orders : 0,
                'revenue' => $row ? (float) $row->revenue : 0.0,
            ];
        })->values()->all();
    }

    // Bookings made per day, zero-filled the same way.
    private function bookingsByDay(int $days): array
    {
        $since = now()->subDays($days - 1)->toDateString();

        $rows = Booking::where('booking_date', '>=', $since)
            ->selectRaw('booking_date as day, COUNT(*) as count')
            ->groupBy('booking_date')
            ->get()
            ->keyBy(fn ($r) => (string) $r->day);

        return collect(range($days - 1, 0))->map(function ($daysAgo) use ($rows) {
            $date = now()->subDays($daysAgo)->toDateString();
            $row = $rows->get($date);

            return ['date' => $date, 'count' => $row ? (int) $row->count : 0];
        })->values()->all();
    }

    // Best-selling menu items by quantity, most recent $days.
    private function topMenuItems(int $days, int $limit): array
    {
        return OrderItem::join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('menu_items', 'menu_items.id', '=', 'order_items.item_id')
            ->where('orders.created_at', '>=', now()->subDays($days))
            ->selectRaw('menu_items.name as name, SUM(order_items.quantity) as quantity')
            ->groupBy('menu_items.id', 'menu_items.name')
            ->orderByDesc('quantity')
            ->limit($limit)
            ->get()
            ->map(fn ($r) => ['name' => $r->name, 'quantity' => (int) $r->quantity])
            ->all();
    }

    // How today's orders are distributed across the kitchen pipeline —
    // zero-filled across all six statuses (see ORDER_STATUSES) so the chart
    // shape doesn't jump around depending on what happened to occur today.
    private function orderStatusToday(): array
    {
        $counts = Order::whereDate('created_at', now()->toDateString())
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return collect(self::ORDER_STATUSES)
            ->map(fn ($status) => ['status' => $status, 'count' => (int) ($counts[$status] ?? 0)])
            ->all();
    }

    // How paid deposits split across payment methods, most recent $days.
    private function paymentMethodShare(int $days): array
    {
        return Payment::join('payment_methods', 'payment_methods.id', '=', 'payments.method_id')
            ->where('payments.status', 'PAID')
            ->where('payments.payment_date', '>=', now()->subDays($days))
            ->selectRaw('payment_methods.method_name as method, SUM(payments.amount) as total')
            ->groupBy('payment_methods.id', 'payment_methods.method_name')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => ['method' => $r->method, 'total' => (float) $r->total])
            ->all();
    }
}
