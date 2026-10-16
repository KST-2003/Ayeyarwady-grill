<?php

// Generate a key pair with:  npx web-push generate-vapid-keys
return [
    'vapid_public_key' => env('VAPID_PUBLIC_KEY'),
    'vapid_private_key' => env('VAPID_PRIVATE_KEY'),
    // Contact the push services can reach if your server misbehaves.
    'vapid_subject' => env('VAPID_SUBJECT', 'mailto:admin@example.com'),
];
