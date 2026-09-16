<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'broadcasting/auth'],

    'allowed_methods' => ['*'],

    // Wide open by design: this is a local dev/demo app with no cookie-based
    // auth (see supports_credentials below and AuthController — Sanctum
    // issues bearer tokens sent via an Authorization header, never a
    // cookie), so there's no CSRF/session risk in accepting any origin.
    // That's what actually makes '*' safe here — browsers refuse to combine
    // a wildcard origin with credentialed requests, so don't turn
    // supports_credentials on without revisiting this. Set CLIENT_URL in
    // .env to lock it back down to one origin if this ever needs to be
    // more restrictive (e.g. a real deployment).
    'allowed_origins' => [env('CLIENT_URL', '*')],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
