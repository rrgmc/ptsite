<?php

namespace PTSite\App\Actions\Nights;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Models\Night;
use PTSite\App\Models\Season;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;
use PTSite\Domain\Shared\RuleViolation;

/**
 * Schedules a new night in an open season. The place defaults to the season's default place.
 */
final class ScheduleNight
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function __invoke(User $user, Season $season, string $startsAt, ?int $placeId, ?string $description): Night
    {
        Gate::forUser($user)->authorize('create', Night::class);
        if ($season->is_finished || $season->isArchived()) {
            throw new RuleViolation('season.not_open');
        }

        return DB::transaction(function () use ($user, $season, $startsAt, $placeId, $description) {
            $night = $season->nights()->create([
                'starts_at' => $startsAt,
                'place_id' => $placeId ?? $season->default_place_id,
                'description' => $description,
                'status' => 'scheduled',
            ]);
            $this->audit->record($user, 'night.scheduled', $night, null, NightSnapshot::of($night));

            return $night;
        });
    }
}
