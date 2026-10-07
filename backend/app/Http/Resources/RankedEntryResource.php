<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Queries\RankedEntry;

/** @mixin RankedEntry */
class RankedEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            /** Lines with the same value share a rank (1, 2, 2, 4). */
            'rank' => $this->rank,
            /** Set in lists of players. */
            'player' => $this->player === null ? null : new PlayerResource($this->player),
            /** Set in "Maiores Potes". */
            'night' => $this->night === null ? null : [
                'id' => $this->night->id,
                'starts_at' => $this->night->starts_at->toIso8601String(),
                'season_id' => $this->night->season_id,
                'season_name' => $this->night->season->name,
            ],
            /** Set in "Locais". */
            'place' => $this->place === null ? null : [
                'id' => $this->place->id,
                'name' => $this->place->name,
            ],
            /** Set in lists that count: nights scored, times in a position, nights at a place. */
            'count' => $this->count,
            /** Set in lists of points or money: a decimal string. */
            'amount' => $this->amount,
        ];
    }
}
