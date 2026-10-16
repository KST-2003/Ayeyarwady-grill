<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Customer;
use App\Models\PushSubscription;
use App\Models\Staff;
use App\Models\StaffRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PushSubscriptionTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = 'https://push.example.com/send/abc123';

    private function payload(array $overrides = []): array
    {
        return array_merge(['endpoint' => self::ENDPOINT, 'p256dh' => 'key-p256dh', 'auth' => 'key-auth'], $overrides);
    }

    private function admin(): Admin
    {
        return Admin::create(['name' => 'Ada', 'email' => 'ada@example.com', 'password' => 'secret123']);
    }

    private function staff(string $email = 'sam@example.com'): Staff
    {
        $role = StaffRole::firstOrCreate(['role_name' => 'Staff'], ['description' => 'x', 'permissions' => 'x']);

        return Staff::create([
            'name' => 'Sam', 'email' => $email, 'password' => 'secret123', 'role_id' => $role->id,
        ]);
    }

    public function test_guests_and_customers_are_rejected(): void
    {
        $this->postJson('/api/push/subscriptions', $this->payload())->assertStatus(401);

        Sanctum::actingAs(Customer::create(['name' => 'C', 'email' => 'c@example.com', 'password' => 'secret123']));
        $this->postJson('/api/push/subscriptions', $this->payload())->assertStatus(403);
        $this->getJson('/api/push/public-key')->assertStatus(403);
    }

    public function test_admin_can_subscribe(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $this->postJson('/api/push/subscriptions', $this->payload())->assertNoContent();

        $this->assertDatabaseHas('push_subscriptions', [
            'user_type' => 'ADMIN', 'user_id' => $admin->id, 'endpoint' => self::ENDPOINT,
        ]);
    }

    public function test_staff_can_subscribe(): void
    {
        $staff = $this->staff();
        Sanctum::actingAs($staff);

        $this->postJson('/api/push/subscriptions', $this->payload())->assertNoContent();

        $this->assertDatabaseHas('push_subscriptions', ['user_type' => 'STAFF', 'user_id' => $staff->id]);
    }

    public function test_subscribing_twice_keeps_one_row_and_moves_it_to_the_new_user(): void
    {
        $admin = $this->admin();
        $staff = $this->staff();

        Sanctum::actingAs($admin);
        $this->postJson('/api/push/subscriptions', $this->payload())->assertNoContent();

        Sanctum::actingAs($staff);
        $this->postJson('/api/push/subscriptions', $this->payload(['auth' => 'rotated']))->assertNoContent();

        $this->assertSame(1, PushSubscription::count());
        $this->assertDatabaseHas('push_subscriptions', [
            'user_type' => 'STAFF', 'user_id' => $staff->id, 'auth' => 'rotated',
        ]);
    }

    public function test_validation(): void
    {
        Sanctum::actingAs($this->admin());

        $this->postJson('/api/push/subscriptions', [])->assertStatus(400);
        $this->postJson('/api/push/subscriptions', $this->payload(['endpoint' => 'not-a-url']))->assertStatus(400);
        $this->assertSame(0, PushSubscription::count());
    }

    public function test_unsubscribe_removes_only_the_callers_subscription(): void
    {
        $admin = $this->admin();
        $staff = $this->staff();

        Sanctum::actingAs($staff);
        $this->postJson('/api/push/subscriptions', $this->payload())->assertNoContent();

        // Someone else can't delete it…
        Sanctum::actingAs($admin);
        $this->deleteJson('/api/push/subscriptions', ['endpoint' => self::ENDPOINT])->assertNoContent();
        $this->assertSame(1, PushSubscription::count());

        // …but the owner can.
        Sanctum::actingAs($staff);
        $this->deleteJson('/api/push/subscriptions', ['endpoint' => self::ENDPOINT])->assertNoContent();
        $this->assertSame(0, PushSubscription::count());
    }

    public function test_public_key_is_served(): void
    {
        config(['webpush.vapid_public_key' => 'PUBLIC-KEY']);
        Sanctum::actingAs($this->admin());

        $this->getJson('/api/push/public-key')->assertOk()->assertJson(['publicKey' => 'PUBLIC-KEY']);
    }
}
