<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateTokenRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'username' => ['required', 'string', 'max:100'],
            'password' => ['required', 'string', 'max:200'],
            /** A name for the device or app, shown when managing tokens. */
            'device_name' => ['required', 'string', 'max:100'],
        ];
    }
}
