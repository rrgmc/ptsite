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
 * "Importar" for a Main Event: records one that already happened, in one step, saved as finished. A finished
 * season takes it too, since a Main Event is often played after its season ends. Only who manages the season
 * adds its Main Event: an admin.
 */
final class ImportMainEventNight
{
    public function __construct(
        private readonly NightRules $rules,
        private readonly WriteMainEventResult $writeResult,
        private readonly AuditLogger $audit,
    ) {}

    /** @param list<int> $playerIds the 1st place first */
    public function __invoke(User $user, Season $season, string $startsAt, ?int $placeId, ?string $description, array $playerIds): Night
    {
        Gate::forUser($user)->authorize('update', $season);
        if ($season->isArchived()) {
            throw new RuleViolation('season.not_open');
        }

        return DB::transaction(function () use ($user, $season, $startsAt, $placeId, $description, $playerIds) {
            $this->rules->assertNoOtherMainEvent(MainEventNight::existsIn($season));
            $night = $season->nights()->create([
                'starts_at' => $startsAt,
                'place_id' => $placeId ?? $season->default_place_id,
                'description' => $description,
                'status' => 'open',
                'type' => NightType::MainEvent->value,
                'is_extra' => true,
            ]);
            ($this->writeResult)($night, $playerIds);
            $this->audit->record($user, 'night.imported', $night, null, NightSnapshot::of($night));

            return $night;
        });
    }
}
