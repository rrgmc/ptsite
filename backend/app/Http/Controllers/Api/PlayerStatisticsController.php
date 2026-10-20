<?php

namespace PTSite\App\Http\Controllers\Api;

use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use PTSite\App\Http\Controllers\Controller;
use PTSite\App\Http\Requests\StatisticsRequest;
use PTSite\App\Http\Resources\PlayerNightResultResource;
use PTSite\App\Http\Resources\PlayerStatisticsResource;
use PTSite\App\Models\Player;
use PTSite\App\Queries\ResultsOfPlayer;
use PTSite\App\Queries\StatisticsOfPlayer;

class PlayerStatisticsController extends Controller
{
    /**
     * One player's statistics over the finished nights: totals, finishing positions, each season and the running
     * total. The nights scored are apart, at `results`.
     * With `season`, one season; without it, every season that is not archived.
     */
    public function show(StatisticsRequest $request, Player $player, StatisticsOfPlayer $statistics): PlayerStatisticsResource
    {
        return new PlayerStatisticsResource($statistics($player, $request->season()));
    }

    /**
     * The nights on which one player scored, newest first.
     * With `season`, one season; without it, every season that is not archived.
     */
    public function results(StatisticsRequest $request, Player $player, ResultsOfPlayer $results): AnonymousResourceCollection
    {
        return PlayerNightResultResource::collection($results($player, $request->season()));
    }
}
