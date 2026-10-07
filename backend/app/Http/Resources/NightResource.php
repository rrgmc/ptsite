<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Models\Night;

/** @mixin Night */
class NightResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'season_id' => $this->season_id,
            'starts_at' => $this->starts_at->toIso8601String(),
            /** @var 'scheduled'|'open'|'finished' */
            'status' => $this->status,
            'description' => $this->description,
            'pot' => $this->pot,
            'main_event_pot' => $this->main_event_pot,
            'time_chip' => $this->time_chip,
            'archived' => $this->archived_at !== null,
            'place' => new PlaceResource($this->whenLoaded('place')),
            'results' => $this->whenLoaded('results', fn () => $this->results->map(fn ($line) => [
                'position' => $line->position,
                'points' => $line->points,
                'player' => new PlayerResource($line->player),
            ])->values()),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
