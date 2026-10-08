<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use PTSite\Domain\Features\Feature;

class ScheduleNightRequest extends FormRequest
{
    use HasFeatures;

    public function rules(): array
    {
        return [
            'starts_at' => ['required', 'date'],
            'place_id' => ['nullable', 'integer', 'exists:places,id'],
            'description' => ['nullable', 'string', 'max:2000'],
            /**
             * regular when left out. main_event only on a site that has the Main Event, and from an admin; a season
             * takes one.
             *
             * @var 'regular'|'main_event'
             */
            'type' => ['sometimes', 'string', Rule::in($this->siteHas(Feature::MainEvent) ? ['regular', 'main_event'] : ['regular'])],
            /** An extra night is outside the season's calendar: not a round, and it may share its date. */
            'is_extra' => ['sometimes', 'boolean'],
        ];
    }
}
