<?php

return [

   'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Default '*' works for development; for production use your real frontend URL
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5174')],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true, // Needed for Sanctum if you use cookies
];
