<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use PTSite\App\Models\Night;
use PTSite\App\Models\Place;
use PTSite\App\Models\Player;
use PTSite\App\Models\Season;
use PTSite\App\Models\User;

/** @mixin User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'name' => $this->name,
            /** @var 'player'|'results_keeper'|'admin' */
            'role' => $this->role->value,
            'player' => new PlayerResource($this->whenLoaded('player')),
            /** What this user may do, so clients can show or hide actions. The API still checks every request. */
            'abilities' => [
                'run_nights' => $this->can('create', Night::class),
                'edit_played_nights' => $this->can('updatePlayed', Night::class),
                'save_partial_results' => $this->can('savePartialResult', Night::class),
                'quick_add_players' => $this->can('quickAdd', Player::class),
                'manage_players' => $this->can('create', Player::class),
                'manage_seasons' => $this->can('create', Season::class),
                'manage_places' => $this->can('create', Place::class),
                'view_audit_log' => $this->isAdmin(),
            ],
        ];
    }
}
