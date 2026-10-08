<?php

namespace PTSite\App\Queries;

use Illuminate\Support\Collection;
use PTSite\App\Models\Night;
use PTSite\App\Models\NightMainEventPosition;
use PTSite\App\Models\NightResult;
use PTSite\App\Models\Player;
use PTSite\App\Models\Season;
use PTSite\Domain\Features\Feature;
use PTSite\Domain\Features\Features;
use PTSite\Domain\Shared\Money;
use PTSite\Domain\Standings\ScoreLine;
use PTSite\Domain\Standings\StandingRow;
use PTSite\Domain\Standings\Standings;

/**
 * The first rows of the standings of every season that is not archived, newest season first.
 * A season with no finished night is listed with no rows. Nothing is stored, as in SeasonStandings.
 * Each season comes with the 1st place of its Main Event, on a site that has one.
 */
final class SeasonsTopStandings
{
    public function __construct(
        private readonly Standings $standings,
        private readonly FinishedNights $finishedNights,
        private readonly Features $features,
    ) {}

    /**
     * @param  Collection<int, Season>  $seasons
     * @param  bool  $withUsers  load each player's account too, for a reader who is shown the login
     * @return list<SeasonTopStandings>
     */
    public function __invoke(Collection $seasons, bool $withUsers = false): array
    {
        $lines = [];
        foreach (($this->finishedNights)(null) as $night) {
            /** @var Night $night */
            foreach ($night->results as $line) {
                /** @var NightResult $line */
                $lines[$night->season_id][] = new ScoreLine($line->player_id, Money::fromDecimal((string) $line->points), $line->position);
            }
        }

        $tops = $seasons->map(fn (Season $season) => $this->standings->top($this->standings->rank($lines[$season->id] ?? [])));

        $ids = $tops->flatMap(fn ($top) => array_map(fn (StandingRow $row) => $row->playerId, $top->rows))->unique()->all();
        $players = Player::query()->when($withUsers, fn ($q) => $q->with('user'))->findMany($ids)->keyBy('id');

        $champions = $this->champions($seasons, $withUsers);

        return $seasons->map(fn (Season $season, $key) => new SeasonTopStandings(
            $season,
            array_map(fn (StandingRow $row) => new StandingEntry(
                $row->rank,
                $players[$row->playerId],
                $row->points->toDecimal(),
                $row->nightsScored,
                $row->wins,
            ), $tops[$key]->rows),
            $tops[$key]->tiedNotShown,
            $champions[$season->id] ?? null,
        ))->values()->all();
    }

    /**
     * @param  Collection<int, Season>  $seasons
     * @return array<int, Player> the 1st place of each season's finished Main Event, by season id
     */
    private function champions(Collection $seasons, bool $withUsers): array
    {
        if (! $this->features->enabled(Feature::MainEvent)) {
            return [];
        }

        return NightMainEventPosition::query()
            ->where('position', 1)
            ->whereHas('night', fn ($q) => $q->finished()->whereIn('season_id', $seasons->modelKeys()))
            ->with(['night:id,season_id', $withUsers ? 'player.user' : 'player'])
            ->get()
            ->mapWithKeys(fn (NightMainEventPosition $line) => [$line->night->season_id => $line->player])
            ->all();
    }
}
