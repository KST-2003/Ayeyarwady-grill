<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

// PHP 8.5 deprecates PDO::MYSQL_ATTR_SSL_CA (used by vendor/laravel/framework's
// config/database.php). With display_errors on, that notice gets echoed
// straight into the HTTP response body ahead of the JSON, breaking every
// API response. Suppress deprecation display only — real errors still show.
error_reporting(E_ALL & ~E_DEPRECATED);

define('LARAVEL_START', microtime(true));

if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

require __DIR__.'/../vendor/autoload.php';

(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());
