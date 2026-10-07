<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Queries\StandingEntry;

/** @mixin StandingEntry */
class StandingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            /** Players with the same total share a rank (1, 2, 2, 4). */
            'rank' => $this->rank,
            'player' => new PlayerResource($this->player),
            'points' => $this->points,
            'nights_scored' => $this->nightsScored,
            'wins' => $this->wins,
        ];
    }
}
