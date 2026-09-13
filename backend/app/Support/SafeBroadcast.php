<?php

namespace App\Support;

use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Support\Facades\Log;

class SafeBroadcast
{
    // The underlying DB write this event announces is already committed by
    // the time we get here — a broken/unreachable broadcast server should
    // only cost the live update, never turn a successful request into a
    // 500 for the user.
    public static function send(ShouldBroadcast $event): void
    {
        try {
            broadcast($event);
        } catch (\Throwable $e) {
            Log::warning('Broadcast failed for '.$event::class.': '.$e->getMessage());
        }
    }
}
