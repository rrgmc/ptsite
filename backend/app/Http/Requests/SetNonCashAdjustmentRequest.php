<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SetNonCashAdjustmentRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            /** The amount to add to what was paid not in cash, as a decimal string such as "20.00" or "-5.00", or null for none. */
            'amount' => ['present', 'nullable', 'string', 'regex:/^-?\d{1,10}(\.\d{1,2})?$/'],
        ];
    }
}
