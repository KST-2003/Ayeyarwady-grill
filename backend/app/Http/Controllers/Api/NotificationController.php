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
            // STAFF and ADMIN both read from staff_id — Admins don't have
            // their own notifications column in this schema (mirrors the
            // original class diagram, which only models Staff here).
            $query->where('staff_id', $user->id);
        }

        return response()->json($query->get());
    }

    // PATCH /api/notifications/{id}/read
    public function markRead($id)
    {
        $notification = Notification::findOrFail($id);
        $notification->update(['is_read' => true]);

        return response()->json($notification);
    }
}
