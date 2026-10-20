<?php

namespace PTSite\App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use PTSite\Domain\Shared\Money;
use PTSite\Domain\Standings\TotalsLine;

class SaveSeasonTotalsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            /** Every player of the final standings, once. An empty list clears them. */
            'rows' => ['present', 'array', 'max:500'],
            'rows.*.player_id' => ['required', 'integer'],
            /** The player's total points for the season. */
            'rows.*.points' => ['required', 'string', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
            /** How often the player finished in each scoring position, the 1st place first. */
            'rows.*.positions' => ['required', 'array', 'min:1', 'max:20'],
            'rows.*.positions.*' => ['required', 'integer', 'min:0', 'max:9999'],
        ];
    }

    /** @return list<TotalsLine> */
    public function lines(): array
    {
        return array_map(function (array $row) {
            $counts = array_map('intval', array_values($row['positions']));

            return new TotalsLine((int) $row['player_id'], Money::fromDecimal($row['points']), array_combine(range(1, count($counts)), $counts));
        }, array_values($this->validated('rows')));
    }
}
