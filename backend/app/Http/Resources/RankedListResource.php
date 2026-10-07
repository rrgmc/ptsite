<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Queries\RankedList;

/** @mixin RankedList */
class RankedListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            /** The finishing position, in a "Posição" list. */
            'position' => $this->position,
            /** At most ten lines, highest first. */
            'rows' => RankedEntryResource::collection($this->rows),
            /** Lines left out that are tied with the last line. */
            'tied_not_shown' => $this->tiedNotShown,
        ];
    }
}
