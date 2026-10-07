<?php

namespace PTSite\Domain\Standings;

use PTSite\Domain\Nights\NightRules;
use PTSite\Domain\Scoring\PercentageTable;
use PTSite\Domain\Scoring\PointsCalculator;
use PTSite\Domain\Shared\Money;

/**
 * "What if" standings: adds an imagined next night to the current results and compares the rankings.
 * Nothing is saved.
 */
final class RankingSimulator
{
    public function __construct(
        private readonly Standings $standings = new Standings,
        private readonly PointsCalculator $calculator = new PointsCalculator,
        private readonly NightRules $rules = new NightRules,
    ) {}

    /**
     * @param  list<ScoreLine>  $currentLines
     * @param  array<int, int>  $playerByPosition  position => player id
     * @return list<SimulatedRow> in simulated rank order
     */
    public function simulate(array $currentLines, Money $pot, array $playerByPosition, PercentageTable $table): array
    {
        $this->rules->assertValidPositions($playerByPosition, $table);

        $points = $this->calculator->calculate($pot, $table);
        $added = [];
        $simulatedLines = $currentLines;
        foreach ($playerByPosition as $position => $playerId) {
            $added[$playerId] = $points[$position];
            $simulatedLines[] = new ScoreLine($playerId, $points[$position], $position);
        }

        $current = [];
        foreach ($this->standings->rank($currentLines) as $row) {
            $current[$row->playerId] = $row;
        }

        $rows = [];
        foreach ($this->standings->rank($simulatedLines) as $row) {
            $before = $current[$row->playerId] ?? null;
            $rows[] = new SimulatedRow(
                $row->playerId,
                $before?->rank,
                $before?->points ?? Money::zero(),
                $row->rank,
                $row->points,
                $added[$row->playerId] ?? Money::zero(),
            );
        }

        return $rows;
    }
}
