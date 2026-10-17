<?php

namespace PTSite\Domain\Statistics;

use PTSite\Domain\Shared\Money;
use PTSite\Domain\Standings\ScoreLine;

/** One finished night, as the statistics see it. */
final readonly class NightRecord
{
    /**
     * @param  list<ScoreLine>  $lines  the night's result lines
     * @param  array<int, int>  $rebuys  what the night dashboard recorded: the rebuys of each player (by id)
     * @param  int  $rebuysAllowed  the rebuys a player may make before the next ones are past the limit
     * @param  list<int>  $timeChips  the players who arrived late and owed a time chip
     */
    public function __construct(
        public int $nightId,
        public int $seasonId,
        public Money $pot,
        public Money $mainEventPot,
        public Money $timeChip,
        public ?int $placeId,
        public array $lines,
        public array $rebuys = [],
        public int $rebuysAllowed = 0,
        public array $timeChips = [],
    ) {}
}
