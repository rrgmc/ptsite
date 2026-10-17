<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Queries\RebuyStatisticsReport;

/** @mixin RebuyStatisticsReport */
class RebuyStatisticsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            /** How many rebuys the night dashboard recorded. */
            'rebuy_count' => $this->rebuyCount,
            /** Players by rebuys (`count`). */
            'rebuys' => new RankedListResource($this->rebuys),
            /** How many of those rebuys were past the limit: money for the pot, with no points for the player. */
            'money_only_rebuy_count' => $this->moneyOnlyRebuyCount,
            /** Players by rebuys past the limit (`count`). */
            'money_only_rebuys' => new RankedListResource($this->moneyOnlyRebuys),
            /** How many time chips late players owed. Null on a site with no time chip. */
            'time_chip_count' => $this->timeChipCount,
            /** Players by nights on which they arrived late (`count`). Null on a site with no time chip. */
            'time_chips' => $this->timeChips === null ? null : new RankedListResource($this->timeChips),
        ];
    }
}
