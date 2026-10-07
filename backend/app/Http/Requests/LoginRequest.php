<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'username' => ['required', 'string', 'max:100'],
            'password' => ['required', 'string', 'max:200'],
            /** Keep the login for 30 days. */
            'remember' => ['sometimes', 'boolean'],
        ];
    }
}
