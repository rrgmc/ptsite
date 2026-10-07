<?php

namespace PTSite\Domain\Statistics;

use PTSite\Domain\Shared\Money;

/** One player's statistics over a set of finished nights. */
final readonly class PlayerStatisticsSummary
{
    /**
     * @param  array<int, int>  $positions  by finishing position, how often the player finished there; 0 included
     * @param  list<PlayerSeasonRow>  $seasons  the seasons in which the player scored, newest first
     * @param  list<PlayerResult>  $results  the nights on which the player scored, newest first
     * @param  list<int>  $progressSteps  night ids or season ids, oldest first
     * @param  list<Money>  $progress  the player's running total after each step
     */
    public function __construct(
        /** Among everyone who scored on these nights. Null when the player did not. */
        public ?int $rank,
        public Money $points,
        public int $nightsScored,
        public int $wins,
        public array $positions,
        public array $seasons,
        public array $results,
        public array $progressSteps,
        public array $progress,
    ) {}
}
