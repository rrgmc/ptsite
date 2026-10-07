<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Models\Holiday;

/** @mixin Holiday */
class HolidayResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            /** national, state or city. */
            'scope' => $this->scope,
            /** Fixed-date holidays: month and day. Null for Easter-based ones. */
            'month' => $this->month,
            'day' => $this->day,
            /** Easter-based holidays: days after Easter Sunday (Sexta-feira Santa is −2). Null for fixed dates. */
            'easter_offset' => $this->easter_offset,
            /** Only from / until these years, when set. */
            'first_year' => $this->first_year,
            'last_year' => $this->last_year,
            'archived' => $this->archived_at !== null,
        ];
    }
}
