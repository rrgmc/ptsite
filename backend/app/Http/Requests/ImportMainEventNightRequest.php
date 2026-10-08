<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportMainEventNightRequest extends FormRequest
{
    use HasMainEventOrder;

    public function rules(): array
    {
        return [
            'starts_at' => ['required', 'date'],
            'place_id' => ['nullable', 'integer', 'exists:places,id'],
            'description' => ['nullable', 'string', 'max:2000'],
            ...$this->orderRules(),
        ];
    }
}
