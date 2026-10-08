<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MarkRebuyRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            /** Whether the rebuy was paid. */
            'paid' => ['required', 'boolean'],
            /** Whether the rebuy was paid, but not in cash. True also marks it as paid. Left out, a paid rebuy stays as it was. */
            'non_cash' => ['sometimes', 'boolean'],
        ];
    }
}
