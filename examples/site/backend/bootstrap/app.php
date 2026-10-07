<?php

use Illuminate\Foundation\Application;
use PTSite\App\Bootstrap;

// The routes, commands and everything else come from the PTSite package.
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(health: '/up')
    ->withMiddleware(Bootstrap::middleware(...))
    ->withExceptions(Bootstrap::exceptions(...))
    ->create();
