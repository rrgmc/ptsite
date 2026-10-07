<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use PTSite\App\Models\Season;

class StatisticsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            /** Leave out for every season. */
            'season' => ['sometimes', 'integer', Rule::exists('seasons', 'id')],
        ];
    }

    public function season(): ?Season
    {
        return $this->has('season') ? Season::query()->find($this->integer('season')) : null;
    }
}
