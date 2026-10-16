<?php

namespace App\Events;

use App\Models\Booking;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

// Broadcast to the private 'staff-room' channel (staff + admin only, see routes/channels.php) — mirrors the Node/Socket.io
// STAFF_ROOM concept. Every connected staff/admin dashboard listens here.
class BookingCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Booking $booking) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('staff-room')];
    }

    public function broadcastWith(): array
    {
        return $this->booking->toArray();
    }

    public function broadcastAs(): string
    {
        return 'booking.new';
    }
}
