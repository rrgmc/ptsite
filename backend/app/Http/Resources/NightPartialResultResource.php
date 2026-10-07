<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Models\NightPartialResult;

/** @mixin NightPartialResult */
class NightPartialResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'pot' => $this->pot,
            'main_event_pot' => $this->main_event_pot,
            'time_chip' => $this->time_chip,
            /** The positions filled so far; the others are left out. */
            'positions' => $this->positions->map(fn ($line) => [
                'position' => $line->position,
                'player' => new PlayerResource($line->player),
            ])->values(),
            /** Who saved it last. Null when nobody saved one yet. */
            'saved_by' => $this->savedBy ? ['id' => $this->savedBy->id, 'name' => $this->savedBy->name] : null,
            /** @var string|null */
            'saved_at' => $this->saved_at?->toIso8601String(),
        ];
    }
}
