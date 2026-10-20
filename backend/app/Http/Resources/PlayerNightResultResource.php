<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Queries\PlayerNightResult;

/** @mixin PlayerNightResult */
class PlayerNightResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'night_id' => $this->nightId,
            'starts_at' => $this->startsAt,
            'season_id' => $this->seasonId,
            'season_name' => $this->seasonName,
            /** The player's finishing position on the night. */
            'position' => $this->position,
            'points' => $this->points,
        ];
    }
}
