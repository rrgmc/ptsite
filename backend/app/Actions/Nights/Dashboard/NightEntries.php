<?php

namespace PTSite\App\Actions\Nights\Dashboard;

use Closure;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Actions\Attendance\AnswerAttendance;
use PTSite\App\Models\Night;
use PTSite\App\Models\NightPlayer;
use PTSite\App\Models\Player;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;
use PTSite\Domain\Attendance\AttendanceAnswer;
use PTSite\Domain\Nights\NightDashboardRules;
use PTSite\Domain\Nights\NightStatus;
use PTSite\Domain\Nights\NightType;
use PTSite\Domain\Shared\RuleViolation;

/**
 * What every change to a night's dashboard shares (docs/specs/night-dashboard.md): who may make it, on which
 * night, and that acting on a player makes them a participant.
 */
final class NightEntries
{
    public function __construct(
        private readonly NightDashboardRules $rules,
        private readonly AnswerAttendance $answer,
        private readonly AuditLogger $audit,
    ) {}

    /**
     * Runs a change under the night's lock, so two phones change the night one after the other.
     *
     * The taps on an open night are not audited: each record keeps who changed it last. On a finished night, a
     * change to what $player bought or paid goes to the audit log.
     *
     * @param  ?Player  $player  the player whose record the change is about, when it is about one
     * @param  Closure(Night): void  $change  takes the locked night
     */
    public function change(User $user, Night $night, ?Player $player, Closure $change): Night
    {
        return DB::transaction(function () use ($user, $night, $player, $change) {
            $night = Night::query()->whereKey($night->id)->lockForUpdate()->firstOrFail();
            Gate::forUser($user)->authorize('view', $night);
            Gate::forUser($user)->authorize('manageDashboard', $night);
            $this->rules->assertHasDashboard(NightStatus::from($night->status), NightType::from($night->type ?? 'regular'), $night->isArchived());

            $before = $player === null ? null : $this->snapshot($night, $player);
            $change($night);
            // Read again: a change made through another action holds a copy of its own.
            $night->refresh();
            if ($player !== null && $night->status === NightStatus::Finished->value) {
                $after = $this->snapshot($night, $player);
                if ($before !== $after) {
                    $this->audit->record($user, 'night.payments_changed', $night, $before, $after);
                }
            }

            return $night;
        });
    }

    /**
     * The player's record on the night, made when there is none. On an open night it also answers ALL IN for
     * them, whatever their answer was.
     */
    public function participant(User $user, Night $night, Player $player): NightPlayer
    {
        if ($player->isArchived()) {
            throw new RuleViolation('attendance.archived_player');
        }
        if ($night->status === NightStatus::Open->value) {
            ($this->answer)($user, $night, $player, AttendanceAnswer::AllIn);
        }

        return NightPlayer::query()->firstOrCreate(
            ['night_id' => $night->id, 'player_id' => $player->id],
            ['updated_by_user_id' => $user->id],
        );
    }

    /** @return array<string, mixed> */
    private function snapshot(Night $night, Player $player): array
    {
        $row = $night->entries()->where('player_id', $player->id)->first();

        return [
            'player_id' => $player->id,
            'participant' => $row !== null,
            'buy_in_paid' => $row?->buy_in_paid_at !== null,
            'time_chip' => $row?->time_chip_at !== null,
            'time_chip_paid' => $row?->time_chip_paid_at !== null,
            'rebuys_paid' => $night->rebuys()->where('player_id', $player->id)->get()->map(fn ($rebuy) => $rebuy->paid_at !== null)->all(),
        ];
    }
}
