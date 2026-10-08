<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SetHouseOwnerRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            /** The owner of the house, or null when nobody is. */
            'player_id' => ['present', 'nullable', 'integer'],
        ];
    }
}
