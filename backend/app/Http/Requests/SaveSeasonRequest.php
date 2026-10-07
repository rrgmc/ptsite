<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveSeasonRequest extends FormRequest
{
    protected function creating(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $creating = $this->creating();

        return [
            'name' => [$creating ? 'required' : 'sometimes', 'string', 'max:100'],
            'starts_on' => [$creating ? 'required' : 'sometimes', 'date_format:Y-m-d'],
            'default_place_id' => ['sometimes', 'nullable', 'integer', 'exists:places,id'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'buy_in' => ['sometimes', 'nullable', 'string', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
            /** How many nights ("rodadas") the season has; 26 by default. Scheduling more is allowed, with a warning. */
            'rounds' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'is_open' => ['sometimes', 'boolean'],
            'is_finished' => ['sometimes', 'boolean'],
            /** Regular night, used to suggest and plan dates: ISO weekday (1 = Monday … 5 = Friday … 7 = Sunday) and time. */
            'schedule_weekday' => ['sometimes', 'integer', 'min:1', 'max:7'],
            'schedule_time' => ['sometimes', 'string', 'date_format:H:i'],
            /** How many weeks apart the regular nights are (1 to 4), used by the season planner. */
            'schedule_every_weeks' => ['sometimes', 'integer', 'min:1', 'max:4'],
            /** Share of the pot per scoring position. Must add up to 100. Defaults to 38/23/15/11/8/5. */
            'percentages' => ['sometimes', 'array', 'min:1', 'max:20'],
            'percentages.*.position' => ['required', 'integer', 'min:1', 'max:20', 'distinct'],
            'percentages.*.percent' => ['required', 'integer', 'min:0', 'max:100'],
        ];
    }

    /** @return array<string, mixed> */
    public function seasonData(): array
    {
        $data = $this->safe()->except('percentages');
        if ($this->has('percentages')) {
            $data['percentages'] = [];
            foreach ($this->validated('percentages') as $row) {
                $data['percentages'][(int) $row['position']] = (int) $row['percent'];
            }
        }

        return $data;
    }
}
