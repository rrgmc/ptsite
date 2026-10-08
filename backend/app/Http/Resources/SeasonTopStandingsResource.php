<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Queries\SeasonTopStandings;

/** @mixin SeasonTopStandings */
class SeasonTopStandingsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'season' => new SeasonResource($this->season),
            /** The first ten of the standings. Empty before the season's first finished night. */
            'rows' => StandingResource::collection($this->rows),
            /** Players left out who have the same total as the last one shown. */
            'tied_not_shown' => $this->tiedNotShown,
            /** The 1st place of the season's Main Event. Null before it is played, and on a site with no Main Event. */
            'main_event_champion' => $this->mainEventChampion ? new PlayerResource($this->mainEventChampion) : null,
        ];
    }
}
