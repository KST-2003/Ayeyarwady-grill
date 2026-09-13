<?php

namespace App\Events;

use App\Models\Booking;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

// Broadcast to the shared 'staff-room' channel — mirrors the Node/Socket.io
// STAFF_ROOM concept. Every connected staff/admin dashboard listens here.
class BookingCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Booking $booking) {}

    public function broadcastOn(): array
    {
        return [new Channel('staff-room')];
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
