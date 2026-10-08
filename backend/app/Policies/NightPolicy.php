<?php

namespace PTSite\App\Policies;

use PTSite\App\Enums\PlayerStatus;
use PTSite\App\Models\Night;
use PTSite\App\Models\Player;
use PTSite\App\Models\User;
use PTSite\Domain\Features\Feature;
use PTSite\Domain\Features\Features;

class NightPolicy
{
    public function __construct(private readonly Features $features) {}

    public function view(User $user, Night $night): bool
    {
        return ! $night->isArchived() || $user->isAdmin();
    }

    /** Players answer for themselves; whoever answers for others, for anyone. */
    public function answerFor(User $user, Night $night, Player $player): bool
    {
        return $user->player_id === $player->id || $this->answerForOthers($user);
    }

    /**
     * Results keepers and admins answer for any player. On a site with the night dashboard, so does whoever
     * changes the dashboard of an open night.
     */
    public function answerForOthers(User $user): bool
    {
        return $user->canRunNights() || ($this->features->enabled(Feature::NightDashboard) && $this->savePartialResult($user));
    }

    /**
     * The night dashboard: the same people as the partial result while the night is open, and only admins once
     * it is finished. A cancelled night has none.
     */
    public function manageDashboard(User $user, Night $night): bool
    {
        if ($night->isArchived()) {
            return false;
        }

        return $night->status === 'finished' ? $user->isAdmin() : $this->savePartialResult($user);
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
