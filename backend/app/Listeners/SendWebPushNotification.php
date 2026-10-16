<?php

namespace App\Listeners;

use App\Contracts\SendsWebPush;
use App\Models\PushSubscription;
use App\Services\WebPushSender;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

// Laravel auto-discovers this from the SendsWebPush type-hint, so any new
// event that implements the interface is delivered with no further wiring.
class SendWebPushNotification implements ShouldQueue
{
    use InteractsWithQueue;

    // Don't push for something that never got committed.
    // Queued listeners are called with only the event, so the sender comes
    // in through the constructor rather than as a handle() argument.
    public function __construct(private WebPushSender $sender) {}

    public bool $afterCommit = true;

    public int $tries = 3;

    public function backoff(): array
    {
        return [10, 60];
    }

    public function handle(SendsWebPush $event): void
    {
        $subscriptions = PushSubscription::whereIn('user_type', $event->webPushRoles())->get();

        $this->sender->send($subscriptions, $event->webPushPayload());
    }
}
