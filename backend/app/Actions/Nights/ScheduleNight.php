<?php

namespace PTSite\App\Actions\Nights;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Models\Night;
use PTSite\App\Models\Season;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;
use PTSite\Domain\Nights\NightRules;
use PTSite\Domain\Nights\NightType;
use PTSite\Domain\Shared\RuleViolation;

/**
 * Schedules a new night in an open season. The place defaults to the season's default place.
 *
 * An extra night is outside the season's calendar: it is not a round and may share its date. A Main Event night
 * is always extra, and a season has one.
 */
final class ScheduleNight
{
    public function __construct(
        private readonly AuditLogger $audit,
        private readonly NightRules $rules,
    ) {}

    /** @param string $type a NightType value */
    public function __invoke(User $user, Season $season, string $startsAt, ?int $placeId, ?string $description, string $type = 'regular', bool $isExtra = false): Night
    {
        Gate::forUser($user)->authorize('create', Night::class);
        if ($season->is_finished || $season->isArchived()) {
            throw new RuleViolation('season.not_open');
        }
        $type = NightType::from($type);

        return DB::transaction(function () use ($user, $season, $startsAt, $placeId, $description, $type, $isExtra) {
            if ($type === NightType::MainEvent) {
                $this->rules->assertNoOtherMainEvent(MainEventNight::existsIn($season));
            }
            $night = $season->nights()->create([
                'starts_at' => $startsAt,
                'place_id' => $placeId ?? $season->default_place_id,
                'description' => $description,
                'status' => 'scheduled',
                'type' => $type->value,
                'is_extra' => $isExtra || $type === NightType::MainEvent,
            ]);
            $this->audit->record($user, 'night.scheduled', $night, null, NightSnapshot::of($night));

            return $night;
        });
    }
}
