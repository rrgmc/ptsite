<?php

namespace PTSite\App\Actions\Nights;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Models\Night;
use PTSite\App\Models\NightPartialResult;
use PTSite\App\Models\User;
use PTSite\Domain\Features\Feature;
use PTSite\Domain\Features\Features;
use PTSite\Domain\Nights\NightRules;
use PTSite\Domain\Nights\NightStatus;
use PTSite\Domain\Nights\NightType;
use PTSite\Domain\Scoring\PercentageTable;

/**
 * Saves an open night's partial result ("Resultado parcial"): the amounts and positions known so far. There is
 * one per night and a save replaces all of it, so the last save wins. On a site with the night dashboard the pot
 * and the time chip are worked out from the payments, so the partial result keeps none.
 *
 * Not audited, whoever saves: it is a shared draft that shows who saved it last, and finishing the night, which
 * is audited, deletes it.
 */
final class SavePartialResult
{
    public function __construct(
        private readonly NightRules $rules,
        private readonly KnownPlayers $players,
        private readonly Features $features,
    ) {}

    /** @param array<int, int> $playerByPosition position => player id; a missing position is empty */
    public function __invoke(User $user, Night $night, ?string $pot, ?string $mainEventPot, ?string $timeChip, array $playerByPosition): NightPartialResult
    {
        Gate::forUser($user)->authorize('view', $night);
        Gate::forUser($user)->authorize('savePartialResult', Night::class);

        return DB::transaction(function () use ($user, $night, $pot, $mainEventPot, $timeChip, $playerByPosition) {
            // The lock keeps a save from landing on a night that is being finished at the same moment.
            $night = Night::query()->whereKey($night->id)->lockForUpdate()->firstOrFail();
            $this->rules->assertTakesPoints(NightType::from($night->type));
            $this->rules->assertCanSavePartialResult(NightStatus::from($night->status), $night->isArchived());
            $this->rules->assertValidPartialPositions($playerByPosition, PercentageTable::of($night->season->percentByPosition()));
            $this->players->assertExist(array_values($playerByPosition));

            $typed = ! $this->features->enabled(Feature::NightDashboard);
            $partial = NightPartialResult::query()->updateOrCreate(['night_id' => $night->id], [
                'pot' => $typed ? $pot : null,
                // An amount of a feature this site has turned off is not kept, whatever was sent.
                'main_event_pot' => $this->features->enabled(Feature::MainEventPot) ? $mainEventPot : null,
                'time_chip' => $typed && $this->features->enabled(Feature::TimeChip) ? $timeChip : null,
                'saved_by_user_id' => $user->id,
                'saved_at' => now(),
            ]);
            $partial->positions()->delete();
            foreach ($playerByPosition as $position => $playerId) {
                $partial->positions()->create(['position' => $position, 'player_id' => $playerId]);
            }

            return $partial;
        });
    }
}
