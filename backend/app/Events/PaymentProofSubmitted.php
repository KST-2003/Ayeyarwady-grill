<?php

namespace App\Events;

use App\Contracts\SendsWebPush;
use App\Models\Booking;
use Illuminate\Foundation\Events\Dispatchable;

class PaymentProofSubmitted implements SendsWebPush
{
    use Dispatchable;

    public function __construct(public Booking $booking) {}

    public function webPushRoles(): array
    {
        return ['ADMIN', 'STAFF'];
    }

    public function webPushPayload(): array
    {
        return [
            'title' => 'Payment proof uploaded',
            'body' => "Table {$this->booking->table?->table_number}'s booking deposit needs verification.",
            'url' => '/staff/bookings',
        ];
    }
}
