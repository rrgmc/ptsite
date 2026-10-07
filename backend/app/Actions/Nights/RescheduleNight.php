<?php

namespace PTSite\App\Actions\Nights;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Models\Night;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;
use PTSite\Domain\Nights\NightRules;
use PTSite\Domain\Nights\NightStatus;
use PTSite\Domain\Shared\RuleViolation;

/**
 * "Remarcar": changes a scheduled night's date and time. The attendance answers are kept.
 * The new date cannot already have another night in the season.
 */
final class RescheduleNight
{
    public function __construct(
        private readonly NightRules $rules,
        private readonly AuditLogger $audit,
    ) {}

    public function __invoke(User $user, Night $night, string $startsAt): Night
    {
        Gate::forUser($user)->authorize('reschedule', $night);
        $this->rules->assertCanReschedule(NightStatus::from($night->status));

        return DB::transaction(function () use ($user, $night, $startsAt) {
            $day = CarbonImmutable::parse($startsAt)->toDateString();
            $taken = Night::query()->notArchived()
                ->where('season_id', $night->season_id)
                ->whereKeyNot($night->id)
                ->whereDate('starts_at', $day)
                ->exists();
            if ($taken) {
                throw new RuleViolation('night.date_taken', 'starts_at', ['date' => CarbonImmutable::parse($day)->isoFormat('L')]);
            }

            $before = NightSnapshot::of($night);
            $night->fill(['starts_at' => $startsAt])->save();
            $this->audit->record($user, 'night.rescheduled', $night, $before, NightSnapshot::of($night));

            return $night;
        });
    }
}
