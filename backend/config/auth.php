<?php

return [

    'defaults' => [
        'guard' => 'web',
        'passwords' => 'customers',
    ],

    // Three separate guards so each role type can be resolved to its own
    // Eloquent model. The API itself authenticates everything through
    // Sanctum (see auth:sanctum in routes/api.php) — Sanctum resolves the
    // correct model automatically via the token's polymorphic tokenable
    // relationship, since Admin, Staff and Customer all use HasApiTokens.
    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'customers',
        ],
        'sanctum' => [
            'driver' => 'sanctum',
            'provider' => null,
        ],
    ],

    'providers' => [
        'admins' => [
            'driver' => 'eloquent',
            'model' => App\Models\Admin::class,
        ],
        'staff' => [
            'driver' => 'eloquent',
            'model' => App\Models\Staff::class,
        ],
        'customers' => [
            'driver' => 'eloquent',
            'model' => App\Models\Customer::class,
        ],
    ],

    'passwords' => [
        'customers' => [
            'provider' => 'customers',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    'password_timeout' => 10800,

];
