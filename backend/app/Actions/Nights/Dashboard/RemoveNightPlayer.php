<?php

namespace PTSite\App\Actions\Nights\Dashboard;

use PTSite\App\Actions\Attendance\AnswerAttendance;
use PTSite\App\Models\Night;
use PTSite\App\Models\Player;
use PTSite\App\Models\User;
use PTSite\Domain\Nights\NightStatus;

/**
 * "Remover do evento": takes a participant with no marks and no rebuys off the night dashboard, for example
 * someone who confirmed and did not come. On an open night it also removes their answer.
 */
final class RemoveNightPlayer
{
    public function __construct(
        private readonly NightEntries $entries,
        private readonly AnswerAttendance $answer,
        private readonly LeaveNightDashboard $leave,
    ) {}

    public function __invoke(User $user, Night $night, Player $player): Night
    {
        return $this->entries->change($user, $night, $player, function (Night $night) use ($user, $player) {
            // Removing the answer takes the player off the dashboard too (AnswerAttendance).
            $night->status === NightStatus::Open->value
                ? ($this->answer)($user, $night, $player, null)
                : ($this->leave)($user, $night, $player);
        });
    }
}
