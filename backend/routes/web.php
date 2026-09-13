<?php

use Illuminate\Support\Facades\Route;

// This is a pure API backend — the React frontend runs separately on
// Vite. This root route just confirms the API is reachable if someone
// opens the backend URL directly in a browser.
Route::get('/', function () {
    return response()->json([
        'message' => 'Ayeyarwady Grill API',
        'docs' => '/api/health',
    ]);
});
