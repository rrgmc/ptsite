<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ScheduleNightsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            /** Date and time of each night to schedule, at the season's default place. */
            'starts_at' => ['required', 'array', 'min:1', 'max:100'],
            'starts_at.*' => ['required', 'date', 'distinct'],
        ];
    }
}
