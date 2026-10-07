<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** Only the fields sent are changed. */
class UpdateNightRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'place_id' => ['sometimes', 'nullable', 'integer', 'exists:places,id'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }
}
