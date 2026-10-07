<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Queries\CalendarHoliday;

/** @mixin CalendarHoliday */
class CalendarHolidayResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'date' => $this->date,
            'name' => $this->name,
            'scope' => $this->scope,
            'holiday_id' => $this->holidayId,
            'cancelled' => $this->cancelled,
            'exception_id' => $this->exceptionId,
        ];
    }
}
