<?php

namespace PTSite\App\Policies;

use PTSite\App\Models\Player;
use PTSite\App\Models\User;

class PlayerPolicy
{
    /** Results keepers and admins can add a new player by nickname while entering results. */
    public function quickAdd(User $user): bool
    {
        return $user->canRunNights();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /** Everything about a player, including the memo, the status and archiving. */
    public function update(User $user, Player $player): bool
    {
        return $user->isAdmin();
    }

    /** The profile: nickname, name, email, birthday, thumbnail and photo. Admins, and the player themself. */
    public function updateProfile(User $user, Player $player): bool
    {
        return $user->isAdmin() || $user->player_id === $player->id;
    }

    /** Site access: create a player's login, change its role, set a new password. */
    public function manageLogin(User $user, Player $player): bool
    {
        return $user->isAdmin();
    }

    public function viewArchived(User $user): bool
    {
        return $user->isAdmin();
    }
}
