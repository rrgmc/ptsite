<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use PTSite\Domain\Features\Feature;

class ImportNightRequest extends FormRequest
{
    use HasFeatures, HasPositions;

    public function rules(): array
    {
        return [
            'starts_at' => ['required', 'date'],
            'place_id' => ['nullable', 'integer', 'exists:places,id'],
            'pot' => ['required', 'string', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
            /** Required, unless the site has no Main Event pot: then it is not kept. */
            'main_event_pot' => [Rule::requiredIf($this->siteHas(Feature::MainEventPot)), 'nullable', 'string', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
            /** Required, unless the site has no time chip: then it is not kept. */
            'time_chip' => [Rule::requiredIf($this->siteHas(Feature::TimeChip)), 'nullable', 'string', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
            /** An extra night is outside the season's calendar: not a round, and it may share its date. */
            'is_extra' => ['sometimes', 'boolean'],
            ...$this->positionRules(),
        ];
    }
}
