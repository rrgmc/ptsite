<?php

namespace PTSite\Domain\Statistics;

use PTSite\Domain\Shared\Money;

/** The running total of the leading players, step by step. A step is a night, or a season in the all-time view. */
final readonly class PointsProgress
{
    /**
     * @param  list<int>  $steps  night ids or season ids, oldest first
     * @param  array<int, list<Money>>  $totals  by player id, the total after each step; leaders first
     */
    public function __construct(
        public array $steps,
        public array $totals,
    ) {}
}
