<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SavePlayerRequest extends FormRequest
{
    protected function creating(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $creating = $this->creating();

        return [
            'nickname' => [$creating ? 'required' : 'sometimes', 'string', 'max:60'],
            'name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'birth_date' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            /** Shown on the player's page. Admins only. */
            'memo' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'status' => ['sometimes', 'in:active,inactive'],
            'archived' => ['sometimes', 'boolean'],
        ];
    }
}
