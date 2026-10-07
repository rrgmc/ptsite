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
            'buy_in' => $this->buy_in,
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
