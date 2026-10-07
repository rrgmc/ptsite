<?php

namespace PTSite\App\Http\Controllers\Api;

use PTSite\App\Http\Controllers\Controller;
use PTSite\App\Http\Requests\StatisticsRequest;
use PTSite\App\Http\Resources\StatisticsResource;
use PTSite\App\Queries\LeagueStatistics;

class StatisticsController extends Controller
{
    /**
     * Statistics of the finished nights: top ten lists and the leaders' running totals.
     * With `season`, one season; without it, every season that is not archived.
     */
    public function show(StatisticsRequest $request, LeagueStatistics $statistics): StatisticsResource
    {
        return new StatisticsResource($statistics($request->season()));
    }
}
