<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerOrdersTest extends TestCase
{
    use RefreshDatabase;

    private function customer(string $email): Customer
    {
        return Customer::create(['name' => 'Cust '.$email, 'email' => $email, 'password' => 'secret123']);
    }

    public function test_admin_sees_only_that_customers_orders_newest_first(): void
    {
        $mine = $this->customer('a@example.com');
        $other = $this->customer('b@example.com');

        $first = Order::create(['customer_id' => $mine->id, 'total_amount' => 1000]);
        $second = Order::create(['customer_id' => $mine->id, 'total_amount' => 2000]);
        $first->forceFill(['created_at' => now()->subHour()])->save();
        Order::create(['customer_id' => $other->id, 'total_amount' => 3000]);
        Order::create(['customer_id' => null, 'total_amount' => 4000]); // guest

        Sanctum::actingAs(Admin::create(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => 'secret123']));

        $ids = collect($this->getJson("/api/customers/{$mine->id}/orders")->assertOk()->json())->pluck('id')->all();

        $this->assertSame([$second->id, $first->id], $ids);
    }

    public function test_customers_cannot_read_order_history_through_the_admin_route(): void
    {
        $c = $this->customer('a@example.com');
        Sanctum::actingAs($c);

        $this->getJson("/api/customers/{$c->id}/orders")->assertStatus(403);
    }

    public function test_customer_list_handles_a_customer_with_orders_but_no_bookings(): void
    {
        $c = $this->customer('a@example.com');
        Order::create(['customer_id' => $c->id, 'total_amount' => 1000, 'status' => 'COMPLETED']);

        Sanctum::actingAs(Admin::create(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => 'secret123']));

        $rows = $this->getJson('/api/customers')->assertOk()->json();

        $this->assertSame(1, $rows[0]['visitCount']);
        $this->assertSame(1, $rows[0]['orderCount']);
    }
}
