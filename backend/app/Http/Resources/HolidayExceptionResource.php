<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Models\HolidayException;

/** @mixin HolidayException */
class HolidayExceptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'year' => $this->year,
            /** Set when a table holiday is cancelled for the year. */
            'holiday_id' => $this->holiday_id,
            /** Set for an extra holiday that year (Y-m-d). */
            'date' => $this->date?->toDateString(),
            'name' => $this->name,
        ];
    }
}
