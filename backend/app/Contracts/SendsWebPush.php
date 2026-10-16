<?php

namespace App\Contracts;

// Implement this on a domain event to have it delivered as a browser push
// notification. The SendWebPushNotification listener picks it up
// automatically — no registration needed.
interface SendsWebPush
{
    /** Account types that should receive the push: 'ADMIN' and/or 'STAFF'. */
    public function webPushRoles(): array;

    /** @return array{title: string, body: string, url: string} */
    public function webPushPayload(): array;
}
