<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SavePlaceRequest extends FormRequest
{
    protected function creating(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => [$this->creating() ? 'required' : 'sometimes', 'string', 'max:100'],
            'address' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'archived' => ['sometimes', 'boolean'],
        ];
    }
}
