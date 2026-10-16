<?php

namespace App\Services;

use App\Models\PushSubscription;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class WebPushSender
{
    public function __construct(private ?WebPush $webPush = null) {}

    private function client(): ?WebPush
    {
        if ($this->webPush) {
            return $this->webPush;
        }

        $public = config('webpush.vapid_public_key');
        $private = config('webpush.vapid_private_key');
        if (! $public || ! $private) {
            return null;
        }

        return $this->webPush = new WebPush(['VAPID' => [
            'subject' => config('webpush.vapid_subject'),
            'publicKey' => $public,
            'privateKey' => $private,
        ]]);
    }

    /**
     * Push $payload to every subscription. Subscriptions the push service
     * reports as gone (404 / 410) are deleted. Never throws.
     *
     * @param  Collection<int, PushSubscription>  $subscriptions
     */
    public function send(Collection $subscriptions, array $payload): void
    {
        if ($subscriptions->isEmpty()) {
            return;
        }

        try {
            $client = $this->client();
            if (! $client) {
                Log::warning('Web push skipped: VAPID keys are not configured.');

                return;
            }

            $byEndpoint = $subscriptions->keyBy('endpoint');
            $json = json_encode([
                'title' => $payload['title'],
                'body' => $payload['body'],
                'data' => ['url' => $payload['url']],
            ]);

            foreach ($subscriptions as $sub) {
                $client->queueNotification(
                    Subscription::create([
                        'endpoint' => $sub->endpoint,
                        'publicKey' => $sub->p256dh,
                        'authToken' => $sub->auth,
                        'contentEncoding' => 'aes128gcm',
                    ]),
                    $json
                );
            }

            foreach ($client->flush() as $report) {
                if ($report->isSubscriptionExpired()) {
                    PushSubscription::where('endpoint_hash', PushSubscription::hashEndpoint($report->getEndpoint()))->delete();
                } elseif (! $report->isSuccess()) {
                    Log::warning('Web push failed: '.$report->getReason());
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Web push error: '.$e->getMessage());
        }
    }
}
