<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SetPartialAmountsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            /** The pot typed for the night, as a decimal string such as "840.00", or null for the one the dashboard works out. */
            'pot' => ['sometimes', 'nullable', 'string', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
            /** The time chip typed for the night, as a decimal string, or null for the one the dashboard works out. Not kept on a site without the time chip. */
            'time_chip' => ['sometimes', 'nullable', 'string', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
        ];
    }
}
