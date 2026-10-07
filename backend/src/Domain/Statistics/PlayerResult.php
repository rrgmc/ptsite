<?php

namespace PTSite\Domain\Statistics;

use PTSite\Domain\Shared\Money;

/** A night on which a player scored. */
final readonly class PlayerResult
{
    public function __construct(
        public int $nightId,
        public int $seasonId,
        public int $position,
        public Money $points,
    ) {}
}
