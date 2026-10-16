<?php

namespace Tests\Support;

use App\Contracts\SendsWebPush;
use Illuminate\Foundation\Events\Dispatchable;

// A brand-new notification type: this class alone is all it takes — the
// queued listener is picked up from the SendsWebPush interface.
class TestPushEvent implements SendsWebPush
{
    use Dispatchable;

    public function __construct(public array $roles) {}

    public function webPushRoles(): array
    {
        return $this->roles;
    }

    public function webPushPayload(): array
    {
        return ['title' => 'T', 'body' => 'B', 'url' => '/x'];
    }
}
