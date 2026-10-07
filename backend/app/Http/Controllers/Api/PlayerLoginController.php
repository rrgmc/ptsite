<?php

namespace PTSite\App\Http\Controllers\Api;

use PTSite\App\Actions\Players\SavePlayerLogin;
use PTSite\App\Http\Controllers\Controller;
use PTSite\App\Http\Requests\SavePlayerLoginRequest;
use PTSite\App\Http\Resources\PlayerResource;
use PTSite\App\Models\Player;

/** A player's site access (admins). */
class PlayerLoginController extends Controller
{
    /** Create the player's login, or change its username, role or password. Returns the player with its login. */
    public function update(SavePlayerLoginRequest $request, Player $player, SavePlayerLogin $save): PlayerResource
    {
        $save($request->user(), $player, $request->validated());

        return new PlayerResource($player->load('user'));
    }
}
