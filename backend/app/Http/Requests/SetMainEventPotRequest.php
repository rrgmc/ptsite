<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SetMainEventPotRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            /** The Main Event pot set by hand, as a decimal string such as "85.00", or null for the season's share of the pot. */
            'amount' => ['present', 'nullable', 'string', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
        ];
    }
}
