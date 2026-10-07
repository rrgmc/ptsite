<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RequestPasswordResetRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            /** The username or the email of the account. */
            'login' => ['required', 'string', 'max:255'],
        ];
    }
}
