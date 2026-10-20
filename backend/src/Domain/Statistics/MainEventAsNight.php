<?php

namespace PTSite\Domain\Statistics;

use PTSite\Domain\Scoring\PercentageTable;
use PTSite\Domain\Scoring\PointsCalculator;
use PTSite\Domain\Shared\Money;
use PTSite\Domain\Standings\ScoreLine;

/**
 * A season's Main Event scored as if it were one more night of the season, for fun: its players get the points of
 * their positions on the average pot of the season's nights. Only the player's "Classificação por temporada"
 * chart counts it; the standings never do.
 */
final class MainEventAsNight
{
    public function __construct(private readonly PointsCalculator $calculator = new PointsCalculator) {}

    /**
     * A season known only by its final standings has no pot of its own: the points it paid, added up, are the pots
     * of its nights, so its average pot is those points over its rounds.
     *
     * @param  list<NightRecord>  $records  the finished nights; only the season's nights with a pot count
     * @param  list<int>  $order  the Main Event's players (by id), first place first
     * @return ?NightRecord null when the season has no night with a pot
     */
    public function record(int $nightId, int $seasonId, array $records, array $order, PercentageTable $table): ?NightRecord
    {
        $total = $nights = 0;
        foreach ($records as $record) {
            if ($record->seasonId !== $seasonId) {
                continue;
            }
            if ($record->isSeasonTotals()) {
                $total += array_sum(array_map(fn ($line) => $line->points->cents, $record->lines));
                $nights += $record->rounds;
            } elseif ($record->pot->isPositive()) {
                $total += $record->pot->cents;
                $nights++;
            }
        }
        if ($nights === 0 || $total === 0) {
            return null;
        }

        $points = $this->calculator->calculate(Money::cents(intdiv($total, $nights)), $table);
        $lines = [];
        foreach (array_values($order) as $index => $playerId) {
            if (isset($points[$index + 1])) {
                $lines[] = new ScoreLine($playerId, $points[$index + 1], $index + 1);
            }
        }

        return new NightRecord($nightId, $seasonId, Money::zero(), Money::zero(), Money::zero(), null, $lines);
    }
}
