<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Restricts a route to one or more roles: 'role:staff,admin'.
     *
     * Admin automatically inherits Staff-only routes, matching the
     * "Admin inherits Staff permissions" rule from the proposal — same
     * behaviour as the Node/Express version's requireRole middleware.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['error' => 'Not authenticated'], 401);
        }

        // Admin, Staff and Customer models each expose a getRoleTypeAttribute()
        // accessor (accessed as ->roleType) returning 'ADMIN' / 'STAFF' / 'CUSTOMER'.
        // Named roleType rather than role specifically to avoid colliding with
        // Staff's own role() relation (belongsTo StaffRole).
        $userRole = $user->roleType;

        $effectiveRoles = $userRole === 'ADMIN' ? ['ADMIN', 'STAFF'] : [$userRole];
        $allowedRoles = array_map('strtoupper', $roles);

        if (empty(array_intersect($effectiveRoles, $allowedRoles))) {
            return response()->json(['error' => 'Insufficient permissions'], 403);
        }

        return $next($request);
    }
}
