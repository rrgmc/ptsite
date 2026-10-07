<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use PTSite\Domain\Attendance\AttendanceAnswer;

class AnswerAttendanceRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            /** "all_in" (coming) or "fold" (not coming). */
            'answer' => ['required', Rule::enum(AttendanceAnswer::class)],
        ];
    }

    public function answer(): AttendanceAnswer
    {
        return AttendanceAnswer::from($this->validated('answer'));
    }
}
