<?php

namespace PTSite\Domain\Statistics;

use PTSite\Domain\Shared\Money;

/** The running total of the leading players, step by step. A step is a night, or a season in the all-time view. */
final readonly class PointsProgress
{
    /**
     * @param  list<int>  $steps  night ids or season ids, oldest first
     * @param  array<int, list<Money>>  $totals  by player id, the total after each step; leaders first
     * @param  list<Money>  $pots  the pot of each step: of the night, or of the season's nights added up
     * @param  list<int>  $rebuys  the rebuys the night dashboard recorded in each step
     * @param  list<int>  $timeChips  the time chips late players owed in each step
     */
    public function __construct(
        public array $steps,
        public array $totals,
        public array $pots,
        public array $rebuys = [],
        public array $timeChips = [],
    ) {}
}
