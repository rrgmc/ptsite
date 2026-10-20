<?php

namespace PTSite\Domain\Statistics;

use PTSite\Domain\Shared\Money;
use PTSite\Domain\Standings\Standings;
use PTSite\Domain\Standings\TotalsLine;

/**
 * The statistics of a set of finished nights: one season's, or every season's.
 *
 * Every list follows {@see Ranking}. The progress follows the ten players with the highest totals, and the rank by
 * season the fifteen with the highest totals. The rebuys and
 * the time chips count what the night dashboard recorded: a night it did not run has none. A season known only by
 * its final standings counts in the points, the nights and the positions, and in a progress with one step per
 * season; it has no pot, no place and no night of its own.
 */
final class Statistics
{
    public const int PROGRESS_PLAYERS = 10;

    public const int RANK_PLAYERS = 15;

    public function __construct(
        private readonly Ranking $ranking = new Ranking,
        private readonly Standings $standings = new Standings,
    ) {}

    /**
     * @param  list<NightRecord>  $nights  oldest first
     * @param  bool  $stepPerSeason  the progress has one step per season instead of one per night
     */
    public function summarise(array $nights, bool $stepPerSeason = false): StatisticsSummary
    {
        $points = $scored = $positions = $pots = $places = $rebuys = $moneyOnlyRebuys = $timeChips = [];
        $potTotal = $mainEventPotTotal = $timeChipTotal = Money::zero();
        $nightsCount = 0;
        foreach ($nights as $night) {
            $nightsCount += $night->rounds ?? 1;
            foreach ($night->lines as $line) {
                $times = $line instanceof TotalsLine ? $line->positions : [$line->position => 1];
                $points[$line->playerId] = ($points[$line->playerId] ?? 0) + $line->points->cents;
                foreach (array_filter($times) as $position => $count) {
                    $scored[$line->playerId] = ($scored[$line->playerId] ?? 0) + $count;
                    $positions[$position][$line->playerId] = ($positions[$position][$line->playerId] ?? 0) + $count;
                }
            }
            if ($night->isSeasonTotals()) {
                continue;
            }
            $potTotal = $potTotal->plus($night->pot);
            $mainEventPotTotal = $mainEventPotTotal->plus($night->mainEventPot);
            $timeChipTotal = $timeChipTotal->plus($night->timeChip);
            $pots[$night->nightId] = $night->pot->cents;
            if ($night->placeId !== null) {
                $places[$night->placeId] = ($places[$night->placeId] ?? 0) + 1;
            }
            foreach ($night->rebuys as $playerId => $count) {
                $rebuys[$playerId] = ($rebuys[$playerId] ?? 0) + $count;
                if ($count > $night->rebuysAllowed) {
                    $moneyOnlyRebuys[$playerId] = ($moneyOnlyRebuys[$playerId] ?? 0) + $count - $night->rebuysAllowed;
                }
            }
            foreach ($night->timeChips as $playerId) {
                $timeChips[$playerId] = ($timeChips[$playerId] ?? 0) + 1;
            }
        }
        ksort($positions);

        $totalPoints = $this->ranking->top($points);
        $positionLists = array_map(fn (array $counts) => $this->ranking->top($counts), $positions);
        $winsShown = array_sum(array_map(fn (RankedRow $row) => $row->value, ($positionLists[1] ?? null)?->rows ?? []));
        $leaders = array_map(fn (RankedRow $row) => $row->id, array_slice($totalPoints->rows, 0, self::PROGRESS_PLAYERS));

        return new StatisticsSummary(
            $nightsCount,
            $potTotal,
            $mainEventPotTotal,
            $timeChipTotal,
            $totalPoints,
            $this->ranking->top($scored),
            $positionLists,
            $this->ranking->top($pots),
            $this->ranking->top($places),
            $this->progress($nights, $leaders, $stepPerSeason),
            array_sum($positions[1] ?? []) - $winsShown,
            $this->positionTable($positions),
            array_sum($rebuys),
            $this->ranking->top($rebuys),
            array_sum($moneyOnlyRebuys),
            $this->ranking->top($moneyOnlyRebuys),
            array_sum($timeChips),
            $this->ranking->top($timeChips),
            array_map(fn (RankedRow $row) => $row->id, $this->ranking->top($points, self::RANK_PLAYERS)->rows),
        );
    }

    /**
     * Every player who scored, with the times in each scoring position, ordered as a medal table: most 1st
     * places first, then most 2nd places, and so on. Players with the same counts share a rank, and the next
     * rank skips, as in {@see Ranking}.
     *
     * @param  array<int, array<int, int>>  $positions  by scoring position, the times of each player (by id)
     * @return list<PositionTableRow>
     */
    public function positionTable(array $positions): array
    {
        ksort($positions);
        $counts = [];
        foreach ($positions as $players) {
            foreach (array_keys($players) as $playerId) {
                $counts[$playerId] ??= array_map(fn (array $times) => $times[$playerId] ?? 0, $positions);
            }
        }
        // Arrays of the same size compare value by value, in order: the 1st places decide first.
        uksort($counts, fn (int $a, int $b): int => array_values($counts[$b]) <=> array_values($counts[$a]) ?: $a <=> $b);

        $rows = [];
        $rank = 0;
        $previous = null;
        foreach ($counts as $playerId => $playerCounts) {
            if ($playerCounts !== $previous) {
                $rank = count($rows) + 1;
            }
            $previous = $playerCounts;
            $rows[] = new PositionTableRow($rank, $playerId, $playerCounts);
        }

        return $rows;
    }

    /**
     * The running total of the given players after each night, or after each season, and the pot, the rebuys
     * and the late time chips of each of those steps. A season known only by its final standings is a step only
     * when there is one step per season: it has no night to be a step of its own.
     *
     * @param  list<NightRecord>  $nights  oldest first
     * @param  list<int>  $leaders  player ids
     */
    public function progress(array $nights, array $leaders, bool $stepPerSeason): PointsProgress
    {
        $running = array_fill_keys($leaders, 0);
        $steps = $pots = $stepRebuys = $stepTimeChips = [];
        $totals = array_fill_keys($leaders, []);
        $pot = Money::zero();
        $rebuys = $timeChips = 0;
        if (! $stepPerSeason) {
            $nights = array_values(array_filter($nights, fn (NightRecord $night) => ! $night->isSeasonTotals()));
        }
        foreach ($nights as $index => $night) {
            $pot = $pot->plus($night->pot);
            $rebuys += array_sum($night->rebuys);
            $timeChips += count($night->timeChips);
            foreach ($night->lines as $line) {
                if (isset($running[$line->playerId])) {
                    $running[$line->playerId] += $line->points->cents;
                }
            }
            $next = $nights[$index + 1] ?? null;
            if ($stepPerSeason && $next !== null && $next->seasonId === $night->seasonId) {
                continue;
            }
            $steps[] = $stepPerSeason ? $night->seasonId : $night->nightId;
            $pots[] = $pot;
            $stepRebuys[] = $rebuys;
            $stepTimeChips[] = $timeChips;
            $pot = Money::zero();
            $rebuys = $timeChips = 0;
            foreach ($leaders as $playerId) {
                $totals[$playerId][] = Money::cents($running[$playerId]);
            }
        }

        return new PointsProgress($steps, $totals, $pots, $stepRebuys, $stepTimeChips);
    }

    /**
     * The position of the given players in each of the given seasons' standings, or null in a season in which a
     * player did not score. Ties share a position, as in {@see Standings}.
     *
     * @param  list<NightRecord>  $nights  any order
     * @param  list<int>  $seasonIds
     * @param  list<int>  $players  player ids
     * @return array<int, list<?int>> by player id, one position per season, in the order of the seasons given
     */
    public function seasonRanks(array $nights, array $seasonIds, array $players): array
    {
        $bySeason = array_fill_keys($seasonIds, []);
        foreach ($nights as $night) {
            if (isset($bySeason[$night->seasonId])) {
                array_push($bySeason[$night->seasonId], ...$night->lines);
            }
        }
        $ranks = array_fill_keys($players, []);
        foreach ($bySeason as $lines) {
            $inSeason = [];
            foreach ($this->standings->rank($lines) as $row) {
                $inSeason[$row->playerId] = $row->rank;
            }
            foreach ($players as $playerId) {
                $ranks[$playerId][] = $inSeason[$playerId] ?? null;
            }
        }

        return $ranks;
    }
}
