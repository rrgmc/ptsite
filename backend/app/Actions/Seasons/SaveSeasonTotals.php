<?php

namespace PTSite\App\Actions\Seasons;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use PTSite\App\Actions\Nights\KnownPlayers;
use PTSite\App\Models\Season;
use PTSite\App\Models\SeasonTotal;
use PTSite\App\Models\User;
use PTSite\App\Support\AuditLogger;
use PTSite\Domain\Scoring\PercentageTable;
use PTSite\Domain\Seasons\SeasonTotalsRules;
use PTSite\Domain\Standings\TotalsLine;

/**
 * Saves the final standings of a season known only by them (admins): for each player, the total points and how
 * often the player finished in each scoring position. They replace the season's final lines, so saving the same
 * lines twice changes nothing; no line clears them.
 */
final class SaveSeasonTotals
{
    public function __construct(
        private readonly SeasonTotalsRules $rules,
        private readonly KnownPlayers $players,
        private readonly AuditLogger $audit,
    ) {}

    /** @param  list<TotalsLine>  $lines */
    public function __invoke(User $user, Season $season, array $lines): void
    {
        Gate::forUser($user)->authorize('update', $season);
        $this->rules->assertCanSaveTotals($season->nights()->notArchived()->scoring()->exists(), $season->isArchived());
        $this->rules->assertValidTotals($lines, (int) $season->rounds, PercentageTable::of($season->percentByPosition()));
        $this->players->assertExist(array_map(fn (TotalsLine $line) => $line->playerId, $lines), 'season.totals.unknown_player', 'rows');

        DB::transaction(function () use ($user, $season, $lines) {
            $before = $this->snapshot($season);
            $season->totals()->delete();
            foreach ($lines as $line) {
                $season->totals()->create([
                    'player_id' => $line->playerId,
                    'points' => $line->points->toDecimal(),
                    'positions' => array_values($line->positions),
                ]);
            }
            $season->unsetRelation('totals');
            $this->audit->record($user, 'season.totals_saved', $season, $before, $this->snapshot($season));
        });
    }

    /** @return array<string, mixed> */
    private function snapshot(Season $season): array
    {
        return ['totals' => $season->totals()->orderBy('player_id')->get()
            ->map(fn (SeasonTotal $total) => ['player_id' => $total->player_id, 'points' => $total->points, 'positions' => $total->positions])
            ->all()];
    }
}
