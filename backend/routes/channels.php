<?php

use Illuminate\Support\Facades\Broadcast;

// All four broadcast events (OrderCreated, OrderStatusChanged,
// TableStatusChanged, BookingCreated) use a public Channel('staff-room'),
// not a PrivateChannel — so no authorization callback is required here.
// This mirrors the original Socket.io setup, which also let any connected
// client join 'staff-room' without a permission check.
//
// If you want to lock this down later (e.g. only Staff/Admin accounts can
// subscribe), switch the events to `new PrivateChannel('staff-room')` and
// add an authorization callback here:
//
// Broadcast::channel('staff-room', function ($user) {
//     return in_array($user->roleType, ['STAFF', 'ADMIN']);
// });
