<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SimulateRequest extends FormRequest
{
    use HasPositions;

    public function rules(): array
    {
        return [
            'pot' => ['required', 'string', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
            ...$this->positionRules(),
        ];
    }
}
