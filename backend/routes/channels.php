<?php

use Illuminate\Support\Facades\Broadcast;

// All four broadcast events (OrderCreated, OrderStatusChanged,
// TableStatusChanged, BookingCreated) use this private channel. Only staff
// and admin accounts may subscribe — customers get a 403 from
// POST /api/broadcasting/auth.
Broadcast::channel('staff-room', function ($user) {
    return in_array($user->roleType, ['STAFF', 'ADMIN'], true);
});
