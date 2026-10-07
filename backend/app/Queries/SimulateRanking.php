<?php

namespace PTSite\App\Queries;

use PTSite\App\Models\Player;
use PTSite\App\Models\Season;
use PTSite\Domain\Scoring\PercentageTable;
use PTSite\Domain\Shared\Money;
use PTSite\Domain\Standings\RankingSimulator;

/**
 * "Simulação": the season's standings as they would be after an imagined next night. Nothing is saved.
 */
final class SimulateRanking
{
    public function __construct(
        private readonly SeasonStandings $standings,
        private readonly RankingSimulator $simulator,
    ) {}

    /**
     * @param  array<int, int>  $playerByPosition  position => player id
     * @return list<SimulatedEntry>
     */
    public function __invoke(Season $season, string $pot, array $playerByPosition): array
    {
        $rows = $this->simulator->simulate(
            $this->standings->scoreLines($season),
            Money::fromDecimal($pot),
            $playerByPosition,
            PercentageTable::of($season->percentByPosition()),
        );
        $players = Player::query()->findMany(array_map(fn ($r) => $r->playerId, $rows))->keyBy('id');

        return array_map(fn ($row) => new SimulatedEntry(
            $players[$row->playerId],
            $row->currentRank,
            $row->currentPoints->toDecimal(),
            $row->simulatedRank,
            $row->simulatedPoints->toDecimal(),
            $row->addedPoints->toDecimal(),
            $row->movement(),
        ), $rows);
    }
}
