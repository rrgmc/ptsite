<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// The website is a single-page app built from frontend/ into public/app. Laravel serves its index.html for every
// /app/* URL, so links such as /app/nights/42 work when opened directly. Built files are served as static files.
Route::redirect('/', '/app/');

$spa = function () {
    $index = public_path('app/index.html');
    abort_unless(is_file($index), 503, 'Frontend not built. Run npm run build in frontend/.');

    return response()->file($index, ['Cache-Control' => 'no-cache']);
};

Route::get('/app/{path?}', $spa)->where('path', '.*');

// PHP's built-in server (php artisan serve) maps /app/login to the public/app directory and passes only
// "/login" to Laravel. Serve the app for those too; unknown API URLs still get a JSON 404.
Route::fallback(function (Request $request) use ($spa) {
    abort_if($request->is('api/*') || ! $request->isMethod('GET'), 404);

    return $spa();
});
