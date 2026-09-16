<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // GET /api/notifications/mine — works for customer or staff, based on role
    public function mine(Request $request)
    {
        $user = $request->user();

        $query = Notification::query()->orderByDesc('created_at')->take(30);

        if ($user->roleType === 'CUSTOMER') {
            $query->where('customer_id', $user->id);
        } else {
            // STAFF and ADMIN share one operational feed rather than a
            // per-person inbox — nothing in this app ever targets a
            // specific staff member (see the writers in OrderController /
            // BookingController / PaymentController, which all leave
            // staff_id null), and Admin has no notifications column of its
            // own in this schema. Comparing staff_id to $user->id would be
            // an outright bug for an Admin: an Admin's id and the staff
            // table's id are different sequences entirely, so it would
            // silently match whichever staff member happens to share that
            // number (or nothing) — not "this admin's notifications".
            // Filtering on "neither staff_id nor customer_id is set" is
            // what actually identifies a floor-wide notification, and it's
            // unambiguous: a customer notification always has customer_id
            // set, so there's no overlap between the two queries.
            $query->whereNull('staff_id')->whereNull('customer_id');
        }

        return response()->json($query->get());
    }

    // PATCH /api/notifications/{id}/read
    public function markRead(Request $request, $id)
    {
        $notification = Notification::findOrFail($id);
        $user = $request->user();

        // Same scoping as mine() — without this, any logged-in user could
        // mark any notification as read (including another customer's)
        // just by guessing an id.
        $owned = $user->roleType === 'CUSTOMER'
            ? $notification->customer_id === $user->id
            : $notification->staff_id === null && $notification->customer_id === null;

        if (! $owned) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $notification->update(['is_read' => true]);

        return response()->json($notification);
    }
}
