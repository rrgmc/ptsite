<?php

namespace PTSite\App\Queries;

use PTSite\App\Models\Night;
use PTSite\App\Models\Place;
use PTSite\App\Models\Player;

/** One line of a statistics list: a player, a night or a place, with a count or an amount. */
final readonly class RankedEntry
{
    public function __construct(
        public int $rank,
        public ?Player $player = null,
        /** With its season loaded. */
        public ?Night $night = null,
        public ?Place $place = null,
        /** For lists that count: nights, times in a position. */
        public ?int $count = null,
        /** For lists of money or points, as a decimal string. */
        public ?string $amount = null,
    ) {}
}
