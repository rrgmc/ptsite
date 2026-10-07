<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SavePartialResultRequest extends FormRequest
{
    use HasPositions;

    public function rules(): array
    {
        return [
            /** The night's pot so far, as a decimal string such as "840.00", or null when not known. */
            'pot' => ['present', 'nullable', 'string', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
            /** The Main Event pot so far, as a decimal string, or null when not known. */
            'main_event_pot' => ['present', 'nullable', 'string', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
            /** The time chip so far, as a decimal string, or null when not known. */
            'time_chip' => ['present', 'nullable', 'string', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
            ...$this->positionRules(required: false),
        ];
    }
}
