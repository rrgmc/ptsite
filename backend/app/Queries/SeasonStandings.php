<?php

namespace PTSite\App\Queries;

use PTSite\App\Models\NightResult;
use PTSite\App\Models\Player;
use PTSite\App\Models\Season;
use PTSite\Domain\Shared\Money;
use PTSite\Domain\Standings\ScoreLine;
use PTSite\Domain\Standings\Standings;

/**
 * The standings of a season, calculated from the results of its finished, non-archived nights.
 * Nothing is stored: a corrected result changes the standings at once.
 */
final class SeasonStandings
{
    public function __construct(private readonly Standings $standings) {}

    /** @return list<StandingEntry> */
    public function __invoke(Season $season): array
    {
        $rows = $this->standings->rank($this->scoreLines($season));
        $players = Player::query()->findMany(array_map(fn ($r) => $r->playerId, $rows))->keyBy('id');

        return array_map(fn ($row) => new StandingEntry(
            $row->rank,
            $players[$row->playerId],
            $row->points->toDecimal(),
            $row->nightsScored,
            $row->wins,
            StandingEntry::positions($row),
        ), $rows);
    }

    /** @return list<ScoreLine> */
    public function scoreLines(Season $season): array
    {
        return NightResult::query()
            ->whereHas('night', fn ($q) => $q->finished()->scoring()->where('season_id', $season->id))
            ->get(['player_id', 'points', 'position'])
            ->map(fn (NightResult $line) => new ScoreLine($line->player_id, Money::fromDecimal((string) $line->points), $line->position))
            ->all();
    }
}
