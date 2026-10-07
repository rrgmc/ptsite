<?php

namespace PTSite\App\Http\Requests;

use PTSite\Domain\Features\Feature;
use PTSite\Domain\Features\Features;

/** For a request whose rules depend on a feature the site can turn off. */
trait HasFeatures
{
    protected function siteHas(Feature $feature): bool
    {
        return app(Features::class)->enabled($feature);
    }
}
