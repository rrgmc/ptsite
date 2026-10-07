<?php

namespace PTSite\Domain\Statistics;

use PTSite\Domain\Shared\Money;
use PTSite\Domain\Standings\ScoreLine;

/** One finished night, as the statistics see it. */
final readonly class NightRecord
{
    /** @param  list<ScoreLine>  $lines  the night's result lines */
    public function __construct(
        public int $nightId,
        public int $seasonId,
        public Money $pot,
        public Money $mainEventPot,
        public Money $timeChip,
        public ?int $placeId,
        public array $lines,
    ) {}
}
