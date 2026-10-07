<?php

use PTSite\App\Providers\PTSiteServiceProvider;

// A site that requires this package gets the provider from Composer (composer.json, "extra"). This folder is
// also the package's own app, where Composer does not do that.
return [
    PTSiteServiceProvider::class,
];
