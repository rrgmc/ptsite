<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Queries\CalendarEntry;

/** @mixin CalendarEntry */
class CalendarEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            /** @var 'night'|'no_night' */
            'kind' => $this->kind,
            'starts_at' => $this->startsAt,
            /** Set for nights. */
            'night' => $this->kind !== 'night' ? null : [
                'id' => $this->nightId,
                /** @var 'scheduled'|'open'|'finished' */
                'status' => $this->status,
                /** @var 'regular'|'main_event' */
                'type' => $this->type,
                /** Outside the season's calendar: not a round. Always true for a Main Event. */
                'is_extra' => $this->isExtra,
                'place' => $this->place,
                /** Nickname of the 1st place, for finished nights. A Main Event has one too. */
                'winner' => $this->winner,
                'pot' => $this->pot,
                /** How many players answered ALL IN. */
                'all_in_count' => $this->allInCount,
                /** @var 'all_in'|'fold'|null */
                'my_answer' => $this->myAnswer,
            ],
            /** Set for regular nights left out: holiday, bridge (the day before is a holiday) or carnival. */
            'skip_reason' => $this->skipKind === null ? null : [
                'kind' => $this->skipKind,
                'holiday' => $this->holiday,
            ],
        ];
    }
}
