<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CompletePasswordResetRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            // The same limits as a password set by an admin (SavePlayerLoginRequest).
            'password' => ['required', 'string', 'min:8', 'max:200'],
        ];
    }
}
