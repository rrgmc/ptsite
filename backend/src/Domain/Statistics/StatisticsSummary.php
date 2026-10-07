<?php

namespace PTSite\Domain\Statistics;

use PTSite\Domain\Shared\Money;

final readonly class StatisticsSummary
{
    /**
     * @param  TopList  $totalPoints  players by total points, in cents
     * @param  TopList  $nightsScored  players by number of nights with points
     * @param  array<int, TopList>  $positions  by finishing position, players by times in that position
     * @param  TopList  $biggestPots  nights by pot, in cents
     * @param  TopList  $places  places by number of nights
     * @param  int  $winsNotShown  first places of players outside the first-place list
     */
    public function __construct(
        public int $nightsCount,
        public Money $potTotal,
        public Money $mainEventPotTotal,
        public Money $timeChipTotal,
        public TopList $totalPoints,
        public TopList $nightsScored,
        public array $positions,
        public TopList $biggestPots,
        public TopList $places,
        public PointsProgress $progress,
        public int $winsNotShown,
    ) {}
}
