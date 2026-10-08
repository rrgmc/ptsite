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
 * "Importar": records a night that already happened, in one step, saved as finished. A past Main Event is
 * recorded by ImportMainEventNight.
 */
final class ImportNight
{
    public function __construct(
        private readonly WriteNightResult $writeResult,
        private readonly AuditLogger $audit,
    ) {}

    /** @param array<int, int> $playerByPosition position => player id */
    public function __invoke(User $user, Season $season, string $startsAt, ?int $placeId, string $pot, ?string $mainEventPot, ?string $timeChip, array $playerByPosition, bool $isExtra = false): Night
    {
        Gate::forUser($user)->authorize('create', Night::class);
        if ($season->isArchived()) {
            throw new RuleViolation('season.not_open');
        }

        return DB::transaction(function () use ($user, $season, $startsAt, $placeId, $pot, $mainEventPot, $timeChip, $playerByPosition, $isExtra) {
            $night = $season->nights()->create([
                'starts_at' => $startsAt,
                'place_id' => $placeId ?? $season->default_place_id,
                'status' => 'open',
                'is_extra' => $isExtra,
            ]);
            ($this->writeResult)($night, $pot, $mainEventPot, $timeChip, $playerByPosition);
            $this->audit->record($user, 'night.imported', $night, null, NightSnapshot::of($night));

            return $night;
        });
    }
}
