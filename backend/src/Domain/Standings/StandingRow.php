<?php

namespace PTSite\Domain\Standings;

use PTSite\Domain\Shared\Money;

final readonly class StandingRow
{
    /** @param  array<int, int>  $positions  by scoring position, how often the player finished there; zeros included */
    public function __construct(
        public int $rank,
        public int $playerId,
        public Money $points,
        public int $nightsScored,
        public int $wins,
        public array $positions = [],
    ) {}
}
