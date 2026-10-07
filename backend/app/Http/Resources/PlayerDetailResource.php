<?php

namespace PTSite\App\Http\Resources;

use Illuminate\Http\Request;
use PTSite\App\Models\Player;

/**
 * One player with the memo, for the players list and the player's page. The players inside other answers use
 * {@see PlayerResource}, which leaves the memo out.
 *
 * @mixin Player
 */
class PlayerDetailResource extends PlayerResource
{
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            // A free text about the player. Everyone logged in reads it; only admins write it.
            'memo' => $this->memo,
        ];
    }
}
