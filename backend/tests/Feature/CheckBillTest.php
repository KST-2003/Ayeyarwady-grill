<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Customer;
use App\Models\DiningTable;
use App\Models\Category;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\QrCode;
use App\Models\TableSection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CheckBillTest extends TestCase
{
    use RefreshDatabase;

    private DiningTable $table;
    private MenuItem $item;

    protected function setUp(): void
    {
        parent::setUp();
        $section = TableSection::create(['section_name' => 'Indoor']);
        $this->table = DiningTable::create(['section_id' => $section->id, 'table_number' => 7, 'capacity' => 4, 'status' => 'OCCUPIED']);
        QrCode::create(['table_id' => $this->table->id, 'token' => 'tok', 'is_active' => true, 'generated_at' => now()]);
        $cat = Category::create(['category_name' => 'Grill', 'display_order' => 1]);
        $this->item = MenuItem::create(['category_id' => $cat->id, 'name' => 'Prawns', 'price' => 5000]);
    }

    private function order(int $qty = 2): Order
    {
        $order = Order::create(['table_id' => $this->table->id, 'total_amount' => 5000 * $qty]);
        $order->items()->create(['item_id' => $this->item->id, 'quantity' => $qty, 'unit_price' => 5000]);

        return $order;
    }

    private function qr(): array
    {
        return ['table' => 7, 'token' => 'tok'];
    }

    public function test_requesting_the_bill_returns_a_receipt_and_flips_the_table(): void
    {
        $this->order(2);
        $this->order(1);

        $bill = $this->postJson('/api/tables/check-bill', $this->qr())->assertOk()->json('bill');

        $this->assertSame(7, $bill['tableNumber']);
        $this->assertEquals(15000, $bill['total']);
        $this->assertEquals([['name' => 'Prawns', 'quantity' => 3, 'unitPrice' => 5000, 'lineTotal' => 15000]], $bill['lines']);
        $this->assertSame('NEEDS_CLEANING', $this->table->fresh()->status);
        $this->assertDatabaseHas('notifications', ['type' => 'BILL_REQUESTED']);
    }

    public function test_wrong_token_is_rejected_and_nothing_to_bill_is_a_422(): void
    {
        $this->postJson('/api/tables/check-bill', ['table' => 7, 'token' => 'nope'])->assertStatus(404);
        $this->postJson('/api/tables/check-bill', $this->qr())->assertStatus(422);
    }

    public function test_asking_twice_returns_the_same_bill(): void
    {
        $this->order(1);
        $first = $this->postJson('/api/tables/check-bill', $this->qr())->json('bill');
        $second = $this->postJson('/api/tables/check-bill', $this->qr())->assertOk()->json('bill');

        $this->assertSame($first['orderIds'], $second['orderIds']);
        $this->assertSame($first['orderIds'], $this->getJson('/api/tables/bill?table=7&token=tok')->json('bill.orderIds'));
    }

    public function test_no_new_orders_once_the_bill_is_requested(): void
    {
        $this->order(1);
        $this->postJson('/api/tables/check-bill', $this->qr())->assertOk();

        $this->postJson('/api/orders', [
            'tableId' => $this->table->id,
            'items' => [['itemId' => $this->item->id, 'quantity' => 1]],
        ])->assertStatus(409);
    }

    public function test_tables_list_flags_the_amount_to_collect(): void
    {
        $this->order(2);
        $this->postJson('/api/tables/check-bill', $this->qr())->assertOk();

        Sanctum::actingAs(Admin::create(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => 'secret123']));

        $row = $this->getJson('/api/tables')->assertOk()->json('0');
        $this->assertTrue($row['billRequested']);
        $this->assertEquals(10000, $row['amountDue']);
    }

    public function test_staff_confirming_payment_records_it_and_completes_the_orders(): void
    {
        $a = $this->order(2);
        $b = $this->order(1);
        $this->postJson('/api/tables/check-bill', $this->qr())->assertOk();
        $method = PaymentMethod::create(['method_name' => 'Cash']);

        Sanctum::actingAs(Admin::create(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => 'secret123']));
        $this->postJson("/api/tables/{$this->table->id}/bill/pay", ['methodId' => $method->id])
            ->assertOk()->assertJson(['paid' => true, 'total' => 15000]);

        $this->assertSame(2, Payment::where('status', 'PAID')->whereIn('order_id', [$a->id, $b->id])->count());
        $this->assertSame(['COMPLETED', 'COMPLETED'], [$a->fresh()->status, $b->fresh()->status]);
        $this->assertSame('NEEDS_CLEANING', $this->table->fresh()->status);

        // Paid: the bill is gone, the badge clears, and a second tap is refused.
        $this->assertNull($this->getJson("/api/tables/{$this->table->id}/bill")->json('bill'));
        $this->assertFalse($this->getJson('/api/tables')->json('0.billRequested'));
        $this->postJson("/api/tables/{$this->table->id}/bill/pay", ['methodId' => $method->id])->assertStatus(409);
        $this->assertEquals(15000, $this->getJson('/api/overview')->json('collectedToday'));
        $this->assertCount(1, $this->getJson('/api/payments/orders')->json());
    }

    public function test_customers_cannot_confirm_payment(): void
    {
        $this->order(1);
        $this->postJson('/api/tables/check-bill', $this->qr())->assertOk();
        $method = PaymentMethod::create(['method_name' => 'Cash']);

        Sanctum::actingAs(Customer::create(['name' => 'C', 'email' => 'c@example.com', 'password' => 'secret123']));
        $this->postJson("/api/tables/{$this->table->id}/bill/pay", ['methodId' => $method->id])->assertStatus(403);
    }
}
