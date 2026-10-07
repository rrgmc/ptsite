<?php

/*
 * The layer rules from docs/architecture/backend-layers.md.
 */

arch('the domain is plain PHP, free of Laravel and the app')
    ->expect('PTSite\Domain')
    ->not->toUse(['Illuminate', 'App', 'Laravel']);

arch('models hold no business rules and call no actions')
    ->expect('PTSite\App\Models')
    ->not->toUse(['PTSite\Domain', 'PTSite\App\Actions', 'PTSite\App\Http']);

arch('controllers do not use the database or the domain directly')
    ->expect('PTSite\App\Http\Controllers')
    ->not->toUse(['Illuminate\Support\Facades\DB', 'PTSite\Domain']);

arch('actions are not tied to HTTP')
    ->expect('PTSite\App\Actions')
    ->not->toUse(['PTSite\App\Http', 'Illuminate\Http\Request']);

arch('no debugging leftovers')
    ->expect(['dd', 'dump', 'var_dump', 'ray'])
    ->not->toBeUsed();

arch('queries are not tied to HTTP')
    ->expect('PTSite\App\Queries')
    ->not->toUse('PTSite\App\Http');
