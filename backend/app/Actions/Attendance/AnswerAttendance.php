<?php

namespace PTSite\App\Actions\Attendance;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Actions\Nights\Dashboard\LeaveNightDashboard;
use PTSite\App\Models\Night;
use PTSite\App\Models\NightAttendance;
use PTSite\App\Models\Player;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;
use PTSite\Domain\Attendance\AttendanceAnswer;
use PTSite\Domain\Attendance\AttendanceRules;
use PTSite\Domain\Features\Feature;
use PTSite\Domain\Features\Features;
use PTSite\Domain\Nights\NightStatus;
use PTSite\Domain\Shared\RuleViolation;

/**
 * Sets or removes a player's "ALL IN" / "FOLD" answer for a night (docs/specs/attendance.md). Players answer for
 * themselves; results keepers and admins for anyone, and those changes are audited. On a site with the night
 * dashboard, whoever changes the dashboard answers for anyone too, and a player with payments cannot leave.
 */
final class AnswerAttendance
{
    public function __construct(
        private readonly AttendanceRules $rules,
        private readonly AuditLogger $audit,
        private readonly Features $features,
        private readonly LeaveNightDashboard $leave,
    ) {}

    /** @param AttendanceAnswer|null $answer null removes the answer */
    public function __invoke(User $user, Night $night, Player $player, ?AttendanceAnswer $answer): ?NightAttendance
    {
        Gate::forUser($user)->authorize('answerFor', [$night, $player]);
        $this->rules->assertOpenForAnswers(NightStatus::from($night->status), $night->isArchived());
        if ($player->isArchived()) {
            throw new RuleViolation('attendance.archived_player');
        }

        return DB::transaction(function () use ($user, $night, $player, $answer) {
            $row = NightAttendance::query()->where('night_id', $night->id)->where('player_id', $player->id)->lockForUpdate()->first();
            $current = $row ? AttendanceAnswer::from($row->answer) : null;
            if ($answer !== AttendanceAnswer::AllIn && $this->features->enabled(Feature::NightDashboard)) {
                ($this->leave)($user, $night, $player);
            }
            if (! $this->rules->changes($current, $answer)) {
                return $row;
            }

            if ($answer === null) {
                $row->delete();
                $row = null;
            } else {
                $row ??= new NightAttendance(['night_id' => $night->id, 'player_id' => $player->id]);
                $row->fill([
                    'answer' => $answer->value,
                    'answered_at' => now(),
                    'answered_by_user_id' => $user->player_id === $player->id ? null : $user->id,
                ])->save();
            }

            if ($user->player_id !== $player->id) {
                $this->audit->record($user, 'attendance.set_for_player', $night,
                    ['player_id' => $player->id, 'answer' => $current?->value],
                    ['player_id' => $player->id, 'answer' => $answer?->value]);
            }

            return $row;
        });
    }
}
