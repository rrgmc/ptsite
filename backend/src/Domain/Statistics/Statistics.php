<?php

namespace PTSite\Domain\Statistics;

use PTSite\Domain\Shared\Money;

/**
 * The statistics of a set of finished nights: one season's, or every season's.
 *
 * Every list follows {@see Ranking}. The progress follows the eight players with the highest totals.
 */
final class Statistics
{
    public const int PROGRESS_PLAYERS = 8;

    public function __construct(private readonly Ranking $ranking = new Ranking) {}

    /**
     * @param  list<NightRecord>  $nights  oldest first
     * @param  bool  $stepPerSeason  the progress has one step per season instead of one per night
     */
    public function summarise(array $nights, bool $stepPerSeason = false): StatisticsSummary
    {
        $points = $scored = $positions = $pots = $places = [];
        $potTotal = $mainEventPotTotal = $timeChipTotal = Money::zero();
        foreach ($nights as $night) {
            $potTotal = $potTotal->plus($night->pot);
            $mainEventPotTotal = $mainEventPotTotal->plus($night->mainEventPot);
            $timeChipTotal = $timeChipTotal->plus($night->timeChip);
            $pots[$night->nightId] = $night->pot->cents;
            if ($night->placeId !== null) {
                $places[$night->placeId] = ($places[$night->placeId] ?? 0) + 1;
            }
            foreach ($night->lines as $line) {
                $points[$line->playerId] = ($points[$line->playerId] ?? 0) + $line->points->cents;
                $scored[$line->playerId] = ($scored[$line->playerId] ?? 0) + 1;
                $positions[$line->position][$line->playerId] = ($positions[$line->position][$line->playerId] ?? 0) + 1;
            }
        }
        ksort($positions);

        $totalPoints = $this->ranking->top($points);
        $positionLists = array_map(fn (array $counts) => $this->ranking->top($counts), $positions);
        $winsShown = array_sum(array_map(fn (RankedRow $row) => $row->value, ($positionLists[1] ?? null)?->rows ?? []));
        $leaders = array_map(fn (RankedRow $row) => $row->id, array_slice($totalPoints->rows, 0, self::PROGRESS_PLAYERS));

        return new StatisticsSummary(
            count($nights),
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
        );
    }

    /**
     * The running total of the given players after each night, or after each season, and the pot of each of
     * those steps.
     *
     * @param  list<NightRecord>  $nights  oldest first
     * @param  list<int>  $leaders  player ids
     */
    public function progress(array $nights, array $leaders, bool $stepPerSeason): PointsProgress
    {
        $running = array_fill_keys($leaders, 0);
        $steps = $pots = [];
        $totals = array_fill_keys($leaders, []);
        $pot = Money::zero();
        foreach ($nights as $index => $night) {
            $pot = $pot->plus($night->pot);
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
            $pot = Money::zero();
            foreach ($leaders as $playerId) {
                $totals[$playerId][] = Money::cents($running[$playerId]);
            }
        }

        return new PointsProgress($steps, $totals, $pots);
    }
}
