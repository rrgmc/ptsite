<?php

namespace PTSite\Domain\Standings;

use PTSite\Domain\Shared\Money;

/**
 * The standings as a story (docs/specs/season-recaps.md, "Digest"): each player's rank before the latest night,
 * the points it gave them, how far they are from the leader and from the row above, and their latest positions.
 */
final class StandingsDigest
{
    public const int FORM_NIGHTS = 5;

    /**
     * @param  list<StandingRow>  $now  the standings
     * @param  list<StandingRow>  $before  the standings without the latest night
     * @param  list<array<int, int>>  $nights  for each finished night, oldest first: player id => position
     * @param  array<int, Money>  $latestNight  the latest night's points by player id
     * @return list<DigestLine>
     */
    public function lines(array $now, array $before, array $nights, array $latestNight): array
    {
        $previousRank = [];
        foreach ($before as $row) {
            $previousRank[$row->playerId] = $row->rank;
        }
        $recent = array_slice($nights, -self::FORM_NIGHTS);
        $leader = $now[0]->points ?? Money::zero();

        $lines = [];
        foreach ($now as $index => $row) {
            $above = $index === 0 ? $row->points : $now[$index - 1]->points;
            $lines[] = new DigestLine(
                $row,
                $previousRank[$row->playerId] ?? null,
                $latestNight[$row->playerId] ?? Money::zero(),
                $leader->minus($row->points),
                $above->minus($row->points),
                array_map(fn (array $positions) => $positions[$row->playerId] ?? null, $recent),
            );
        }

        return $lines;
    }
}
