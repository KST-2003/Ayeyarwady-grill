<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class OptionalSanctumAuth
{
    /**
     * Attempts to authenticate the request via Sanctum's bearer token if
     * one is present, but never blocks the request when it's missing or
     * invalid — used on routes that work for both guests and logged-in
     * users (e.g. placing an order after scanning a table's QR code
     * without an account). Mirrors the Node backend's optionalAuth.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->bearerToken()) {
            if ($user = Auth::guard('sanctum')->user()) {
                $request->setUserResolver(fn () => $user);
            }
        }

        return $next($request);
    }
}
