<?php

namespace App\Providers;

use App\Services\WebPushSender;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Without this the container autowires a key-less WebPush into the
        // sender, which then never builds the client carrying the VAPID keys.
        $this->app->bind(WebPushSender::class, fn () => new WebPushSender());
    }

    public function boot(): void
    {
        //
    }
}
