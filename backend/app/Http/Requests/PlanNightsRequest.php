<?php

namespace PTSite\App\Http\Requests;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;

class PlanNightsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            /** First day of the plan (Y-m-d). */
            'from' => ['required', 'date_format:Y-m-d'],
            /** Last day of the plan (Y-m-d), at most about 18 months later. */
            'to' => ['required', 'date_format:Y-m-d'],
            /** Stop after this many planned nights, even before `to`: the rounds the season still needs. */
            'count' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function from(): CarbonImmutable
    {
        return CarbonImmutable::parse($this->validated('from'));
    }

    public function count(): ?int
    {
        return $this->has('count') ? (int) $this->validated('count') : null;
    }

    public function to(): CarbonImmutable
    {
        return CarbonImmutable::parse($this->validated('to'));
    }
}
