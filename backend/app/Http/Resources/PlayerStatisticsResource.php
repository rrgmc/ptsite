<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Queries\PlayerStatisticsReport;

/** @mixin PlayerStatisticsReport */
class PlayerStatisticsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            /** Null for every season. */
            'season_id' => $this->seasonId,
            /** The player's position by total points among everyone who scored. Null when the player did not. */
            'rank' => $this->rank,
            'points' => $this->points,
            /** On how many nights the player scored. */
            'nights_scored' => $this->nightsScored,
            /** How many nights the player won. */
            'wins' => $this->wins,
            /** How often the player finished in each scoring position, first place first. Positions never reached have count 0. */
            'positions' => $this->positions,
            /** The player's line in the standings of each season in which they scored, newest first. */
            'seasons' => $this->seasons,
            /** The nights on which the player scored, newest first. */
            'results' => $this->results,
            /** The player's running total: per night in a season, per season otherwise. */
            'points_progress' => [
                /** Oldest first. `night_id` and `starts_at` are null when the step is a season. */
                'steps' => $this->progressSteps,
                /** The total after each step, as decimal strings. */
                'points' => $this->progressPoints,
            ],
        ];
    }
}
