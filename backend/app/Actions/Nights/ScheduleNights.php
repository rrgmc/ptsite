<?php

namespace PTSite\App\Actions\Nights;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Models\Night;
use PTSite\App\Models\Season;
use PTSite\App\Models\User;
use PTSite\Domain\Shared\RuleViolation;

/**
 * Schedules the nights chosen in the season planner, all or none. Each one is scheduled (and audited) like a single
 * night. Dates that already have a round of the season, or that are sent twice, are refused.
 */
final class ScheduleNights
{
    public function __construct(private readonly ScheduleNight $schedule) {}

    /**
     * @param  list<string>  $startsAt
     * @return list<Night>
     */
    public function __invoke(User $user, Season $season, array $startsAt): array
    {
        Gate::forUser($user)->authorize('update', $season);

        $taken = $season->nights()->notArchived()->rounds()->pluck('starts_at')
            ->map(fn ($d) => CarbonImmutable::parse($d)->toDateString())->flip();
        foreach ($startsAt as $i => $value) {
            $date = CarbonImmutable::parse($value);
            if ($taken->has($date->toDateString())) {
                throw new RuleViolation('plan.date_taken', "starts_at.{$i}", ['date' => $date->isoFormat('L')]);
            }
            $taken->put($date->toDateString(), true); // the same date twice in one request
        }

        return DB::transaction(fn () => array_map(
            fn (string $value) => ($this->schedule)($user, $season, $value, null, null),
            $startsAt,
        ));
    }
}
