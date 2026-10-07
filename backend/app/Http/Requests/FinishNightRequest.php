<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use PTSite\Domain\Features\Feature;

class FinishNightRequest extends FormRequest
{
    use HasFeatures, HasPositions;

    public function rules(): array
    {
        return [
            /** The night's pot, as a decimal string such as "840.00". */
            'pot' => ['required', 'string', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
            /**
             * The money set aside for the Main Event, as a decimal string. "0" when there is none. Required,
             * unless the site has no Main Event pot: then it is not kept.
             */
            'main_event_pot' => [Rule::requiredIf($this->siteHas(Feature::MainEventPot)), 'nullable', 'string', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
            /**
             * The money set aside for the year party (rebuys and late arrivals), as a decimal string. "0" when
             * there is none. Required, unless the site has no time chip: then it is not kept.
             */
            'time_chip' => [Rule::requiredIf($this->siteHas(Feature::TimeChip)), 'nullable', 'string', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
            ...$this->positionRules(),
        ];
    }
}
