<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Models\SeasonRecap;

/** @mixin SeasonRecap */
class SeasonRecapResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'season_id' => $this->season_id,
            /** The night the recap comes after, or null when it is about no single night. */
            'night' => $this->night === null ? null : [
                'id' => $this->night->id,
                'starts_at' => $this->night->starts_at->toIso8601String(),
            ],
            /** Plain text, with line breaks. */
            'body' => $this->body,
            'published' => $this->published_at !== null,
            'published_at' => $this->published_at?->toIso8601String(),
            /** The name of the account that wrote it. */
            'author' => $this->author?->name,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
