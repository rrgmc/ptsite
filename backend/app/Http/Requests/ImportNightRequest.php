<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportNightRequest extends FormRequest
{
    use HasPositions;

    public function rules(): array
    {
        return [
            'starts_at' => ['required', 'date'],
            'place_id' => ['nullable', 'integer', 'exists:places,id'],
            'pot' => ['required', 'string', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
            'main_event_pot' => ['required', 'string', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
            'time_chip' => ['required', 'string', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
            ...$this->positionRules(),
        ];
    }
}
