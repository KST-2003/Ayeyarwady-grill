<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Customer;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Staff;
use Database\Seeders\DemoDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoDataSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeds_a_realistic_dataset_without_creating_live_work(): void
    {
        $this->seed(DemoDataSeeder::class);

        $this->assertSame(40, Customer::count());
        $this->assertSame(12, Staff::count());
        $this->assertGreaterThanOrEqual(20, MenuItem::count());
        $this->assertSame(160, Order::count());

        // Nothing the floor would have to act on.
        $this->assertSame(0, Order::whereNotIn('status', ['COMPLETED', 'CANCELLED'])->count());
        $this->assertSame(0, Booking::whereIn('status', ['PENDING'])->count());
        $this->assertSame(0, Booking::where('booking_date', '>=', now()->toDateString())->count());

        // A mix of logged-in and guest orders.
        $this->assertGreaterThan(0, Order::whereNotNull('customer_id')->count());
        $this->assertGreaterThan(0, Order::whereNull('customer_id')->count());

        // Totals match their lines.
        Order::with('items')->get()->each(
            fn ($o) => $this->assertEquals($o->items->sum(fn ($i) => $i->unit_price * $i->quantity), $o->total_amount)
        );
    }

    public function test_running_it_twice_does_not_duplicate(): void
    {
        $this->seed(DemoDataSeeder::class);
        $this->seed(DemoDataSeeder::class);

        $this->assertSame(40, Customer::count());
        $this->assertSame(160, Order::count());
    }
}
