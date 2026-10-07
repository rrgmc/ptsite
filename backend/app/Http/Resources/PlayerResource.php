<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Models\Player;

/** @mixin Player */
class PlayerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isAdmin = (bool) $request->user()?->isAdmin();
        $isSelf = $request->user()?->player_id === $this->id;

        return [
            'id' => $this->id,
            'nickname' => $this->nickname,
            'name' => $this->name,
            'status' => $this->status->value,
            'archived' => $this->archived_at !== null,
            // Null when the player has no thumbnail. The image is at /players/{id}/thumbnail; add ?v=<this value>
            // to the URL, because the answer is cached for a year.
            'thumbnail_version' => $this->thumbnail_version,
            // The same for the larger photo, at /players/{id}/photo.
            'photo_version' => $this->photo_version,
            // Contact details only for admins and the player themself.
            'email' => $this->when($isAdmin || $isSelf, $this->email),
            'birth_date' => $this->when($isAdmin || $isSelf, $this->birth_date?->toDateString()),
            // Site access, only for admins: null when the player has no login.
            'login' => $this->when($isAdmin, fn () => $this->user === null ? null : [
                'username' => $this->user->username,
                /** @var 'player'|'results_keeper'|'admin' */
                'role' => $this->user->role->value,
                'last_login_at' => $this->user->last_login_at?->toIso8601String(),
            ]),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
