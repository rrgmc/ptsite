<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FinishMainEventNightRequest extends FormRequest
{
    use HasMainEventOrder;

    public function rules(): array
    {
        return $this->orderRules();
    }
}
