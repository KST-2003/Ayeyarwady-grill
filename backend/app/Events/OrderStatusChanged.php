<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

// Broadcast to the private 'staff-room' channel (staff + admin only, see routes/channels.php) — mirrors the Node/Socket.io
// STAFF_ROOM concept. Every connected staff/admin dashboard listens here.
class OrderStatusChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Order $order) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('staff-room')];
    }

    // Sends the order's own (already camelCase, via CamelCaseAttributes)
    // array directly as the payload, rather than Laravel's default of
    // wrapping it as {"order": {...}} — keeps the frontend's Echo
    // listener receiving the same flat shape the old Socket.io emitter sent.
    public function broadcastWith(): array
    {
        return $this->order->toArray();
    }

    public function broadcastAs(): string
    {
        return 'order.status-changed';
    }
}
