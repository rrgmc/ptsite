<?php

namespace PTSite\Domain\Statistics;

/**
 * Ranks values, highest first, and keeps the first rows.
 *
 * As in the standings, equal values share a rank and the next rank skips (1, 2, 2, 4); tied rows are listed by
 * id so the order is stable. When the cut falls inside a tie, the list says how many tied rows it left out.
 */
final class Ranking
{
    public const int LIMIT = 10;

    /** @param  array<int, int>  $valueById  a count or an amount in cents, by player, night or place id */
    public function top(array $valueById, int $limit = self::LIMIT): TopList
    {
        uksort($valueById, fn (int $a, int $b): int => $valueById[$b] <=> $valueById[$a] ?: $a <=> $b);

        $rows = [];
        $rank = 0;
        $previous = null;
        $index = 0;
        foreach ($valueById as $id => $value) {
            if ($value !== $previous) {
                $rank = $index + 1;
            }
            $previous = $value;
            $rows[] = new RankedRow($rank, $id, $value);
            $index++;
        }

        $shown = array_slice($rows, 0, $limit);
        $last = $shown === [] ? null : $shown[count($shown) - 1]->value;
        $tiedNotShown = count(array_filter(array_slice($rows, $limit), fn (RankedRow $row) => $row->value === $last));

        return new TopList($shown, $tiedNotShown);
    }
}
