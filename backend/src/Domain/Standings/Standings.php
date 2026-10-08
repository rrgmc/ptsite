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
    public const int TOP = 10;

    /**
     * @param  iterable<ScoreLine>  $lines  result lines of the season's finished nights
     * @return list<StandingRow>
     */
    public function rank(iterable $lines): array
    {
        /** @var array<int, array{points: Money, nights: int, wins: int, positions: array<int, int>}> $totals */
        $totals = [];
        $lastPosition = 0;
        foreach ($lines as $line) {
            $total = $totals[$line->playerId] ?? ['points' => Money::zero(), 'nights' => 0, 'wins' => 0, 'positions' => []];
            $total['points'] = $total['points']->plus($line->points);
            $total['nights']++;
            $total['positions'][$line->position] = ($total['positions'][$line->position] ?? 0) + 1;
            $lastPosition = max($lastPosition, $line->position);
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
            // Every row has every scoring position of these nights, in order, with 0 where the player never finished.
            $positions = [];
            for ($position = 1; $position <= $lastPosition; $position++) {
                $positions[$position] = $totals[$playerId]['positions'][$position] ?? 0;
            }
            $rows[] = new StandingRow($rank, $playerId, $points, $totals[$playerId]['nights'], $totals[$playerId]['wins'], $positions);
        }

        return $rows;
    }

    /**
     * The first rows of the standings. When the cut falls inside a tie, it says how many tied rows it left out.
     *
     * @param  list<StandingRow>  $rows  the result of rank()
     */
    public function top(array $rows, int $limit = self::TOP): TopStandings
    {
        $shown = array_slice($rows, 0, $limit);
        $last = $shown === [] ? null : $shown[count($shown) - 1]->rank;

        return new TopStandings($shown, count(array_filter(array_slice($rows, $limit), fn (StandingRow $row) => $row->rank === $last)));
    }
}
