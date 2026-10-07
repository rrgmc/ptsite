<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Queries\SimulatedEntry;

/** @mixin SimulatedEntry */
class SimulatedStandingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'player' => new PlayerResource($this->player),
            'current_rank' => $this->currentRank,
            'current_points' => $this->currentPoints,
            'simulated_rank' => $this->simulatedRank,
            'simulated_points' => $this->simulatedPoints,
            'added_points' => $this->addedPoints,
            /** Places moved up (positive) or down (negative); null if the player was not ranked before. */
            'movement' => $this->movement,
        ];
    }
}
