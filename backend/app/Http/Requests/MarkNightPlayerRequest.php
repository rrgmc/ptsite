<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use PTSite\Domain\Features\Feature;

class MarkNightPlayerRequest extends FormRequest
{
    use HasFeatures;

    public function rules(): array
    {
        $noTimeChip = Rule::prohibitedIf(! $this->siteHas(Feature::TimeChip));

        return [
            /** Whether the player paid the buy-in. */
            'buy_in_paid' => ['sometimes', 'boolean'],
            /** Whether the buy-in was paid, but not in cash: a bank transfer, for instance. True also marks it as paid. A buy-in that is not paid is never "not in cash". */
            'buy_in_non_cash' => ['sometimes', 'boolean'],
            /** Whether the player arrived late and owes a time chip. False also unmarks it as paid. Refused on a site without the time chip. */
            'time_chip' => [$noTimeChip, 'sometimes', 'boolean'],
            /** Whether the player paid that time chip. True also marks it as owed. Refused on a site without the time chip. */
            'time_chip_paid' => [$noTimeChip, 'sometimes', 'boolean'],
        ];
    }
}
