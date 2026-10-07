<?php

namespace PTSite\Domain\Standings;

use PTSite\Domain\Shared\Money;

final readonly class StandingRow
{
    public function __construct(
        public int $rank,
        public int $playerId,
        public Money $points,
        public int $nightsScored,
        public int $wins,
    ) {}
}
