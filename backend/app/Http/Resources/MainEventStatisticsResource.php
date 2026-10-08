<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Queries\MainEventStatisticsReport;

/** @mixin MainEventStatisticsReport */
class MainEventStatisticsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            /** How many finished Main Events count. */
            'count' => $this->count,
            /** Players by Main Events won (`count`). */
            'titles' => new RankedListResource($this->titles),
            /** Players by times in the first three of a Main Event (`count`). */
            'podiums' => new RankedListResource($this->podiums),
            /** Players by Main Events played (`count`). */
            'appearances' => new RankedListResource($this->appearances),
        ];
    }
}
