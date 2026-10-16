<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PushSubscriptionController extends Controller
{
    // GET /api/push/public-key — the VAPID public key the browser needs to subscribe
    public function publicKey()
    {
        return response()->json(['publicKey' => config('webpush.vapid_public_key')]);
    }

    // POST /api/push/subscriptions — register (or re-assign) this browser
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'endpoint' => 'required|url|max:2048',
            'p256dh' => 'required|string|max:255',
            'auth' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $user = $request->user();

        // Upsert on the endpoint: if a different person logs in on the same
        // browser, the subscription moves to them.
        PushSubscription::updateOrCreate(
            ['endpoint_hash' => PushSubscription::hashEndpoint($request->input('endpoint'))],
            [
                'user_type' => $user->roleType,
                'user_id' => $user->id,
                'endpoint' => $request->input('endpoint'),
                'p256dh' => $request->input('p256dh'),
                'auth' => $request->input('auth'),
                'user_agent' => substr((string) $request->userAgent(), 0, 255),
            ]
        );

        return response()->json(null, 204);
    }

    // DELETE /api/push/subscriptions — called on logout. Only removes the
    // caller's own subscription.
    public function destroy(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'endpoint' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $user = $request->user();

        PushSubscription::where('endpoint_hash', PushSubscription::hashEndpoint($request->input('endpoint')))
            ->where('user_type', $user->roleType)
            ->where('user_id', $user->id)
            ->delete();

        return response()->json(null, 204);
    }
}
