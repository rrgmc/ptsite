<?php

namespace PTSite\Domain\Standings;

use PTSite\Domain\Shared\Money;

/**
 * Ranks players by their total points, highest first. Only players who have scored appear.
 *
 * There is no tie-breaker: players with the same total share the same rank, and the next rank
 * skips accordingly (1, 2, 2, 4). Tied players are listed by player id so the order is stable.
 */
final class Standings
{
    /**
     * @param  iterable<ScoreLine>  $lines  result lines of the season's finished nights
     * @return list<StandingRow>
     */
    public function rank(iterable $lines): array
    {
        /** @var array<int, array{points: Money, nights: int, wins: int}> $totals */
        $totals = [];
        foreach ($lines as $line) {
            $total = $totals[$line->playerId] ?? ['points' => Money::zero(), 'nights' => 0, 'wins' => 0];
            $total['points'] = $total['points']->plus($line->points);
            $total['nights']++;
            if ($line->position === 1) {
                $total['wins']++;
            }
            $totals[$line->playerId] = $total;
        }

        uksort($totals, function (int $a, int $b) use ($totals): int {
            return $totals[$b]['points']->compare($totals[$a]['points']) ?: $a <=> $b;
        });

        $rows = [];
        $rank = 0;
        $previous = null;
        foreach (array_keys($totals) as $index => $playerId) {
            $points = $totals[$playerId]['points'];
            if ($previous === null || ! $points->equals($previous)) {
                $rank = $index + 1;
            }
            $previous = $points;
            $rows[] = new StandingRow($rank, $playerId, $points, $totals[$playerId]['nights'], $totals[$playerId]['wins']);
        }

        return $rows;
    }
}
