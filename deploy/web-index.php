<?php

// The site's front controller on the shared host, where the Laravel app lives outside the document root.
// It is backend/public/index.php with the app's folder written in: deploy/cpanel-upload.sh puts the folder's
// path in place of the placeholder below and uploads the file as index.php. Keep the two files in step.

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

const APP_DIR = '__APP_DIR__';

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = APP_DIR.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require APP_DIR.'/vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once APP_DIR.'/bootstrap/app.php';

// The built website (app/index.html) is next to this file, not in the app's own public/ folder.
$app->usePublicPath(__DIR__);

$app->handleRequest(Request::capture());
