<?php

namespace PTSite\App\Http\Controllers\Api;

use PTSite\App\Http\Controllers\Controller;
use PTSite\App\Http\Requests\StatisticsRequest;
use PTSite\App\Http\Resources\PlayerStatisticsResource;
use PTSite\App\Models\Player;
use PTSite\App\Queries\StatisticsOfPlayer;

class PlayerStatisticsController extends Controller
{
    /**
     * One player's statistics over the finished nights: totals, finishing positions, each season, each night
     * scored and the running total.
     * With `season`, one season; without it, every season that is not archived.
     */
    public function show(StatisticsRequest $request, Player $player, StatisticsOfPlayer $statistics): PlayerStatisticsResource
    {
        return new PlayerStatisticsResource($statistics($player, $request->season()));
    }
}
