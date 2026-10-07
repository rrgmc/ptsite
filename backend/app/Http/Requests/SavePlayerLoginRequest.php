<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SavePlayerLoginRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'username' => ['sometimes', 'string', 'max:100', 'regex:/^\S+$/'],
            'role' => ['sometimes', 'in:player,results_keeper,admin'],
            'password' => ['sometimes', 'string', 'min:8', 'max:200'],
        ];
    }
}
