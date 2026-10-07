<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use PTSite\Domain\Calendar\HolidayScope;

class SaveHolidayRequest extends FormRequest
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
            'scope' => [$creating ? 'required' : 'sometimes', Rule::enum(HolidayScope::class)],
            /** Fixed-date holidays: month and day. Leave out for Easter-based ones. */
            'month' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:12'],
            'day' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:31'],
            /** Easter-based holidays: days after Easter Sunday (Sexta-feira Santa is −2, Corpus Christi 60). */
            'easter_offset' => ['sometimes', 'nullable', 'integer', 'min:-100', 'max:100'],
            'first_year' => ['sometimes', 'nullable', 'integer', 'min:1900', 'max:2200'],
            'last_year' => ['sometimes', 'nullable', 'integer', 'min:1900', 'max:2200'],
            'archived' => ['sometimes', 'boolean'],
        ];
    }
}
