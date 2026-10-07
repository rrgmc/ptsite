<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RescheduleNightRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'starts_at' => ['required', 'date'],
        ];
    }
}
