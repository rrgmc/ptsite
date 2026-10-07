<?php

namespace PTSite\Domain\Statistics;

use PTSite\Domain\Shared\Money;
use PTSite\Domain\Standings\ScoreLine;
use PTSite\Domain\Standings\StandingRow;
use PTSite\Domain\Standings\Standings;

/**
 * One player's statistics over a set of finished nights: one season's, or every season's.
 *
 * Ranks follow {@see Standings}: players with the same total share a rank.
 */
final class PlayerStatistics
{
    public function __construct(
        private readonly Standings $standings = new Standings,
        private readonly Statistics $statistics = new Statistics,
    ) {}

    /**
     * @param  list<NightRecord>  $nights  oldest first
     * @param  bool  $stepPerSeason  the progress has one step per season instead of one per night
     */
    public function summarise(int $playerId, array $nights, bool $stepPerSeason = false): PlayerStatisticsSummary
    {
        $lines = $bySeason = $positions = $results = [];
        foreach ($nights as $night) {
            foreach ($night->lines as $line) {
                $lines[] = $line;
                $bySeason[$night->seasonId][] = $line;
                // Every scoring position of these nights is counted, so the ones the player never reached show 0.
                $positions[$line->position] ??= 0;
                if ($line->playerId === $playerId) {
                    $positions[$line->position]++;
                    $results[] = new PlayerResult($night->nightId, $night->seasonId, $line->position, $line->points);
                }
            }
        }
        ksort($positions);

        $seasons = [];
        foreach ($bySeason as $seasonId => $seasonLines) {
            $row = $this->rowOf($playerId, $seasonLines);
            if ($row !== null) {
                $seasons[] = new PlayerSeasonRow($seasonId, $row->rank, $row->points, $row->nightsScored, $row->wins);
            }
        }

        $row = $this->rowOf($playerId, $lines);
        $progress = $this->statistics->progress($nights, [$playerId], $stepPerSeason);

        return new PlayerStatisticsSummary(
            $row?->rank,
            $row?->points ?? Money::zero(),
            $row?->nightsScored ?? 0,
            $row?->wins ?? 0,
            $positions,
            array_reverse($seasons),
            array_reverse($results),
            $progress->steps,
            $progress->totals[$playerId],
        );
    }

    /** @param  list<ScoreLine>  $lines */
    private function rowOf(int $playerId, array $lines): ?StandingRow
    {
        foreach ($this->standings->rank($lines) as $row) {
            if ($row->playerId === $playerId) {
                return $row;
            }
        }

        return null;
    }
}
