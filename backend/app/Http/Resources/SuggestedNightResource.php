<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Queries\SuggestedNight;

/** @mixin SuggestedNight */
class SuggestedNightResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'starts_at' => $this->startsAt,
        ];
    }
}
