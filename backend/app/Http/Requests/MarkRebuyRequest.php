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
        ];
    }
}
