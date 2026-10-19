<?php

use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentMethod;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    // Demo rows for the cashier's "Payments collected" list: settles 15 orders
    // that were served but never paid, mixing logged-in customers and guests
    // (no customer on the order -> shown as "Guest").
    public function up(): void
    {
        $methods = collect(['Cash', 'KBZPay', 'WavePay'])
            ->map(fn ($name) => PaymentMethod::firstOrCreate(['method_name' => $name]));

        $unpaid = fn () => Order::where('status', 'COMPLETED')
            ->whereNotNull('table_id')
            ->whereDoesntHave('payments')
            ->where('total_amount', '>', 0)
            ->latest('id');

        $orders = $unpaid()->whereNull('customer_id')->limit(9)->get()
            ->concat($unpaid()->whereNotNull('customer_id')->limit(6)->get())
            ->sortByDesc('id')
            ->values();

        foreach ($orders as $i => $order) {
            // Spread over the last ~2 weeks; the first two land today.
            $paidAt = now()->subDays(intdiv($i, 2))->subMinutes(mt_rand(5, 600));

            $order->forceFill(['bill_requested_at' => $paidAt->copy()->subMinutes(5)])->save();

            Payment::create([
                'order_id' => $order->id,
                'method_id' => $methods[$i % $methods->count()]->id,
                'amount' => $order->total_amount,
                'payment_date' => $paidAt,
                'status' => 'PAID',
            ]);
        }
    }

    public function down(): void
    {
        // Demo data only; nothing to undo safely.
    }
};
