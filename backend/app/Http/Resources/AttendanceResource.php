<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Models\NightAttendance;

/** @mixin NightAttendance */
class AttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'player' => new PlayerResource($this->player),
            /** @var 'all_in'|'fold' */
            'answer' => $this->answer,
            'answered_at' => $this->answered_at->toIso8601String(),
            /** Who set the answer, when it was not the player: a results keeper or admin. */
            'answered_by' => $this->answeredBy ? ['id' => $this->answeredBy->id, 'name' => $this->answeredBy->name] : null,
        ];
    }
}
