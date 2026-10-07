<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class QuickAddPlayerRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'nickname' => ['required', 'string', 'min:1', 'max:60'],
        ];
    }
}
