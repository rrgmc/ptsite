<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Queries\PlannedDate;

/** @mixin PlannedDate */
class PlannedDateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'starts_at' => $this->startsAt,
            /** Ticked for scheduling. */
            'included' => $this->included,
            /** The season already has a night on this date. */
            'taken' => $this->taken,
            /** The existing night on a taken date. */
            'night_id' => $this->nightId,
            /** Why the date is left out, or null. */
            'skip_reason' => $this->skipKind === null ? null : [
                /** holiday, bridge (the day before is a holiday) or carnival. */
                'kind' => $this->skipKind,
                'holiday' => $this->holiday,
            ],
        ];
    }
}
