<?php

namespace PTSite\App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use PTSite\Domain\Features\Feature;
use PTSite\Domain\Features\Features;
use Symfony\Component\HttpFoundation\Response;

/**
 * Answers 404 on a route of a feature this site has turned off, as if the route did not exist.
 */
final class RequireFeature
{
    public function __construct(private readonly Features $features) {}

    /** The middleware for a route: `->middleware(RequireFeature::for(Feature::SeasonPlanner))`. */
    public static function for(Feature $feature): string
    {
        return self::class.':'.$feature->value;
    }

    public function handle(Request $request, Closure $next, string $feature): Response
    {
        abort_unless($this->features->enabled(Feature::from($feature)), 404);

        return $next($request);
    }
}
