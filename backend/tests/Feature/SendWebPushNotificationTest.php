<?php

namespace Tests\Feature;

use App\Contracts\SendsWebPush;
use App\Events\NewOrderPlaced;
use App\Listeners\SendWebPushNotification;
use App\Models\PushSubscription;
use App\Services\WebPushSender;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Event;
use Mockery;
use Mockery\MockInterface;
use Tests\Support\TestPushEvent;
use Tests\TestCase;

class SendWebPushNotificationTest extends TestCase
{
    use RefreshDatabase;

    private function subscribe(string $type, int $id, string $endpoint): void
    {
        PushSubscription::create([
            'user_type' => $type, 'user_id' => $id, 'endpoint' => $endpoint,
            'endpoint_hash' => PushSubscription::hashEndpoint($endpoint),
            'p256dh' => 'p', 'auth' => 'a',
        ]);
    }

    private function fakeEvent(array $roles): SendsWebPush
    {
        return new TestPushEvent($roles);
    }

    public function test_listener_sends_only_to_the_roles_the_event_declares(): void
    {
        $this->subscribe('ADMIN', 1, 'https://push.example.com/admin');
        $this->subscribe('STAFF', 1, 'https://push.example.com/staff');

        $sender = $this->mock(WebPushSender::class, function (MockInterface $m) {
            $m->shouldReceive('send')->once()->withArgs(function (Collection $subs, array $payload) {
                return $subs->pluck('endpoint')->all() === ['https://push.example.com/admin']
                    && $payload === ['title' => 'T', 'body' => 'B', 'url' => '/x'];
            });
        });

        (new SendWebPushNotification($sender))->handle($this->fakeEvent(['ADMIN']));
    }

    public function test_dispatching_an_event_reaches_the_listener_without_registration(): void
    {
        $this->subscribe('ADMIN', 1, 'https://push.example.com/admin');
        $this->subscribe('STAFF', 2, 'https://push.example.com/staff');

        $this->mock(WebPushSender::class, function (MockInterface $m) {
            $m->shouldReceive('send')->once()->withArgs(fn (Collection $subs) => $subs->count() === 2);
        });

        // Auto-discovered from the SendsWebPush type-hint.
        event($this->fakeEvent(['ADMIN', 'STAFF']));
    }

    public function test_the_listener_is_queued_and_runs_after_commit(): void
    {
        $listener = new SendWebPushNotification(new WebPushSender);

        $this->assertInstanceOf(\Illuminate\Contracts\Queue\ShouldQueue::class, $listener);
        $this->assertTrue($listener->afterCommit);
    }

    public function test_domain_events_build_the_expected_payload(): void
    {
        $order = new \App\Models\Order;
        $order->setRelation('table', null);

        $event = new NewOrderPlaced($order);

        $this->assertSame(['ADMIN', 'STAFF'], $event->webPushRoles());
        $this->assertSame(
            ['title' => 'New order', 'body' => 'New walk-in order placed.', 'url' => '/staff/orders'],
            $event->webPushPayload()
        );
    }

    public function test_sender_deletes_subscriptions_the_push_service_reports_gone(): void
    {
        $this->subscribe('ADMIN', 1, 'https://push.example.com/gone');
        $this->subscribe('ADMIN', 1, 'https://push.example.com/alive');

        $gone = Mockery::mock(\Minishlink\WebPush\MessageSentReport::class);
        $gone->shouldReceive('isSubscriptionExpired')->andReturn(true);
        $gone->shouldReceive('getEndpoint')->andReturn('https://push.example.com/gone');

        $alive = Mockery::mock(\Minishlink\WebPush\MessageSentReport::class);
        $alive->shouldReceive('isSubscriptionExpired')->andReturn(false);
        $alive->shouldReceive('isSuccess')->andReturn(true);

        $webPush = Mockery::mock(\Minishlink\WebPush\WebPush::class);
        $webPush->shouldReceive('queueNotification')->twice();
        $webPush->shouldReceive('flush')->andReturnUsing(function () use ($gone, $alive) {
            yield $gone;
            yield $alive;
        });

        (new WebPushSender($webPush))->send(
            PushSubscription::all(),
            ['title' => 'T', 'body' => 'B', 'url' => '/x']
        );

        $this->assertSame(
            ['https://push.example.com/alive'],
            PushSubscription::pluck('endpoint')->all()
        );
    }

    public function test_sender_never_throws(): void
    {
        $this->subscribe('ADMIN', 1, 'https://push.example.com/a');

        $webPush = Mockery::mock(\Minishlink\WebPush\WebPush::class);
        $webPush->shouldReceive('queueNotification')->andThrow(new \RuntimeException('boom'));

        (new WebPushSender($webPush))->send(PushSubscription::all(), ['title' => 'T', 'body' => 'B', 'url' => '/x']);

        $this->assertTrue(true);
    }
}
