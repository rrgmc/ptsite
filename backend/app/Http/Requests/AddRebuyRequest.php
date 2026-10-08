<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AddRebuyRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            /** How many rebuys the player had on the screen when "+ Rebuy" was tapped. */
            'count' => ['required', 'integer', 'min:0', 'max:50'],
        ];
    }
}
