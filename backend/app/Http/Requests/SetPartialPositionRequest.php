<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SetPartialPositionRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            /** The player in this position, or null to empty it. */
            'player_id' => ['present', 'nullable', 'integer'],
        ];
    }
}
