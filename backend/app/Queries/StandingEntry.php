<?php

namespace PTSite\App\Queries;

use PTSite\App\Models\Player;

final readonly class StandingEntry
{
    public function __construct(
        public int $rank,
        public Player $player,
        /** Total points, as a decimal string. */
        public string $points,
        public int $nightsScored,
        public int $wins,
    ) {}
}
