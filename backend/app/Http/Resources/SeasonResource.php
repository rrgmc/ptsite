<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Models\Season;

/** @mixin Season */
class SeasonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'starts_on' => $this->starts_on->toDateString(),
            'description' => $this->description,
            /** What a player pays to enter a night. On a site with the night dashboard, a night's money is worked out from the season's money settings. */
            'buy_in' => $this->buy_in,
            /** A rebuy's price, without the time chip it may also charge. */
            'rebuy_value' => $this->rebuy_value,
            /** The price of one time chip. */
            'time_chip_value' => $this->time_chip_value,
            /** How many rebuys a player can make on a night; 0 means none. */
            'rebuys_allowed' => $this->rebuys_allowed,
            /** Whether a rebuy also charges a time chip. */
            'rebuy_charges_time_chip' => $this->rebuy_charges_time_chip,
            /** Whether a player can rebuy past the allowed number; those rebuys do not count for the season's points. */
            'allows_extra_rebuys' => $this->allows_extra_rebuys,
            /** The smaller buy-in of the owner of the house where the night is played. */
            'house_owner_buy_in' => $this->house_owner_buy_in,
            /** The share of a night's pot that the night dashboard suggests as its Main Event pot, in whole percent. */
            'main_event_pot_percent' => $this->main_event_pot_percent,
            /** How many nights ("rodadas") the season has. */
            'rounds' => $this->rounds,
            /** The season's nights that are not archived, in any state; compare with rounds. */
            'nights_planned' => $this->whenHas('nights_planned_count', fn ($count) => (int) $count),
            'is_open' => $this->is_open,
            'is_finished' => $this->is_finished,
            'archived' => $this->archived_at !== null,
            /**
             * The regular night, used to suggest and plan dates. Weekday is ISO: 1 = Monday … 5 = Friday … 7 = Sunday.
             * every_weeks: 1 = every week, 2 = every other week, up to 4.
             */
            'schedule' => [
                'weekday' => $this->schedule_weekday,
                'time' => $this->schedule_time,
                'every_weeks' => $this->schedule_every_weeks,
            ],
            'default_place' => new PlaceResource($this->whenLoaded('defaultPlace')),
            /** Share of the pot for each scoring position, in whole percent. */
            'percentages' => $this->whenLoaded('percentages', fn () => $this->percentages
                ->map(fn ($p) => ['position' => $p->position, 'percent' => $p->percent])->values()),
            'nights_count' => $this->whenCounted('nights'),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
