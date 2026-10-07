<?php

namespace PTSite\App\Policies;

use PTSite\App\Enums\PlayerStatus;
use PTSite\App\Models\Night;
use PTSite\App\Models\Player;
use PTSite\App\Models\User;

class NightPolicy
{
    public function view(User $user, Night $night): bool
    {
        return ! $night->isArchived() || $user->isAdmin();
    }

    /** Players answer for themselves; results keepers and admins for anyone. */
    public function answerFor(User $user, Night $night, Player $player): bool
    {
        return $user->player_id === $player->id || $user->canRunNights();
    }

    /** Active players fill the open night's partial result; so do results keepers and admins. */
    public function savePartialResult(User $user): bool
    {
        if ($user->canRunNights()) {
            return true;
        }
        $player = $user->player;

        return $player !== null && $player->status === PlayerStatus::Active && ! $player->isArchived();
    }

    public function create(User $user): bool
    {
        return $user->canRunNights();
    }

    public function open(User $user, Night $night): bool
    {
        return $user->canRunNights();
    }

    public function reschedule(User $user, Night $night): bool
    {
        return $user->canRunNights();
    }

    /** "Editar evento": the place and description. A cancelled night is not edited. */
    public function update(User $user, Night $night): bool
    {
        if ($night->isArchived()) {
            return false;
        }

        return $night->status === 'scheduled' ? $user->canRunNights() : $this->updatePlayed($user);
    }

    /** Only admins edit a night that is open or finished. */
    public function updatePlayed(User $user): bool
    {
        return $user->isAdmin();
    }

    public function cancel(User $user, Night $night): bool
    {
        return $user->canRunNights();
    }

    public function finish(User $user, Night $night): bool
    {
        return $user->canRunNights();
    }
}
