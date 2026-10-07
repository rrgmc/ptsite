<?php

namespace PTSite\Domain\Statistics;

use PTSite\Domain\Shared\Money;

/** A player's line in one season's standings. */
final readonly class PlayerSeasonRow
{
    public function __construct(
        public int $seasonId,
        public int $rank,
        public Money $points,
        public int $nightsScored,
        public int $wins,
    ) {}
}
