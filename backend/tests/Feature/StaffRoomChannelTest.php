<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Customer;
use App\Models\Staff;
use App\Models\StaffRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StaffRoomChannelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'broadcasting.default' => 'reverb',
            'broadcasting.connections.reverb.key' => 'k',
            'broadcasting.connections.reverb.secret' => 's',
            'broadcasting.connections.reverb.app_id' => 'a',
        ]);

        // Channels are registered on the broadcaster that is the default at
        // boot time (null in tests), so register them on the reverb one too.
        require base_path('routes/channels.php');
    }

    private function auth(): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => 'private-staff-room',
        ]);
    }

    public function test_guests_are_rejected(): void
    {
        $this->auth()->assertStatus(401);
    }

    public function test_customers_are_rejected(): void
    {
        Sanctum::actingAs(Customer::create(['name' => 'C', 'email' => 'c@example.com', 'password' => 'secret123']));

        $this->auth()->assertStatus(403);
    }

    public function test_admins_are_authorized(): void
    {
        Sanctum::actingAs(Admin::create(['name' => 'A', 'email' => 'a@example.com', 'password' => 'secret123']));

        $this->auth()->assertOk()->assertJsonStructure(['auth']);
    }

    public function test_staff_are_authorized(): void
    {
        $role = StaffRole::create(['role_name' => 'Staff', 'description' => 'x', 'permissions' => 'x']);
        Sanctum::actingAs(Staff::create([
            'name' => 'S', 'email' => 's@example.com', 'password' => 'secret123', 'role_id' => $role->id,
        ]));

        $this->auth()->assertOk()->assertJsonStructure(['auth']);
    }
}
