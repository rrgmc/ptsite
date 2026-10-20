<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Queries\ChampionshipStatisticsReport;

/** @mixin ChampionshipStatisticsReport */
class ChampionshipStatisticsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            /** How many finished seasons count. */
            'count' => $this->count,
            /** Players by seasons finished in 1st place of the standings (`count`). Players who share the 1st place each count a title. */
            'titles' => new RankedListResource($this->titles),
            /** Players by seasons finished in the first three of the standings (`count`). */
            'podiums' => new RankedListResource($this->podiums),
            /** Players by seasons in whose standings they are, that is, in which they scored (`count`). */
            'appearances' => new RankedListResource($this->appearances),
        ];
    }
}
