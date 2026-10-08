<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Models\Night;

/** @mixin Night */
class NightResource extends JsonResource
{
    /** What a night is loaded with to be shown whole. */
    public const RELATIONS = ['place', 'results.player', 'mainEventPositions.player'];

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'season_id' => $this->season_id,
            'starts_at' => $this->starts_at->toIso8601String(),
            /** @var 'scheduled'|'open'|'finished' */
            'status' => $this->status,
            /**
             * What the result is. regular: a pot and points. main_event: the order of the players, with no pot.
             *
             * @var 'regular'|'main_event'
             */
            'type' => $this->type ?? 'regular',
            /** Outside the season's calendar: not a round, and it may share its date. Always true for a Main Event. */
            'is_extra' => (bool) $this->is_extra,
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
            /** The result of a Main Event night: its players in finishing order. Empty on any other night. */
            'main_event_positions' => $this->whenLoaded('mainEventPositions', fn () => $this->mainEventPositions->map(fn ($line) => [
                'position' => $line->position,
                'player' => new PlayerResource($line->player),
            ])->values()),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
