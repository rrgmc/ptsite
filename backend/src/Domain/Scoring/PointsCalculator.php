<?php

namespace PTSite\Domain\Scoring;

use PTSite\Domain\Shared\Money;

/**
 * Points are money: each scoring position receives its percentage of the night's pot.
 */
final class PointsCalculator
{
    /** @return array<int, Money> position => points */
    public function calculate(Money $pot, PercentageTable $table): array
    {
        $points = [];
        foreach ($table->percentByPosition as $position => $percent) {
            $points[$position] = $pot->percent($percent);
        }

        return $points;
    }
}
