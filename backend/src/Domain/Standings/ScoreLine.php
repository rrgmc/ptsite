<?php

namespace PTSite\Domain\Standings;

use PTSite\Domain\Shared\Money;

/** One result line that counts towards the standings: a player's points on one finished night. */
final readonly class ScoreLine
{
    public function __construct(
        public int $playerId,
        public Money $points,
        public int $position,
    ) {}
}
