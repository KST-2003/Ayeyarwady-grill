<?php

namespace App\Events;

use App\Contracts\SendsWebPush;
use App\Models\Booking;
use Illuminate\Foundation\Events\Dispatchable;

class BookingRequested implements SendsWebPush
{
    use Dispatchable;

    public function __construct(public Booking $booking) {}

    public function webPushRoles(): array
    {
        return ['ADMIN', 'STAFF'];
    }

    public function webPushPayload(): array
    {
        $b = $this->booking;

        return [
            'title' => 'New booking request',
            'body' => "Table {$b->table?->table_number} for {$b->guest_count} guests, "
                .$b->booking_date->toDateString()." at {$b->booking_time}.",
            'url' => '/staff/bookings',
        ];
    }
}
