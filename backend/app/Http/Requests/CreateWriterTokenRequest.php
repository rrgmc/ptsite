<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateWriterTokenRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            /** The writer account, made the first time. Default "writer". */
            'username' => ['sometimes', 'string', 'max:100'],
            /** A name for the token. Default "api". */
            'name' => ['sometimes', 'string', 'max:100'],
            /** Delete the account's other tokens first, so a token that leaked stops working. */
            'replace' => ['sometimes', 'boolean'],
        ];
    }
}
