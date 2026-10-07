<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FinishNightRequest extends FormRequest
{
    use HasPositions;

    public function rules(): array
    {
        return [
            /** The night's pot, as a decimal string such as "840.00". */
            'pot' => ['required', 'string', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
            /** The money set aside for the Main Event, as a decimal string. "0" when there is none. */
            'main_event_pot' => ['required', 'string', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
            /** The money set aside for the year party (rebuys and late arrivals), as a decimal string. "0" when there is none. */
            'time_chip' => ['required', 'string', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
            ...$this->positionRules(),
        ];
    }
}
