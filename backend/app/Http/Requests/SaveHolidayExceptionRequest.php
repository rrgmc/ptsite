<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** Either holiday_id (cancel that holiday for the year) or date and name (an extra holiday that year). */
class SaveHolidayExceptionRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'year' => ['required', 'integer', 'min:1900', 'max:2200'],
            'holiday_id' => ['required_without:date', 'prohibits:date,name', 'nullable', 'integer', 'exists:holidays,id'],
            'date' => ['required_without:holiday_id', 'nullable', 'date_format:Y-m-d'],
            'name' => ['required_with:date', 'nullable', 'string', 'max:100'],
        ];
    }
}
