<?php

namespace PTSite\Domain\Statistics;

use PTSite\Domain\Shared\Money;
use PTSite\Domain\Standings\ScoreLine;
use PTSite\Domain\Standings\TotalsLine;

/**
 * One finished night, as the statistics see it. A season known only by its final standings is one record for all
 * its rounds: see {@see self::seasonTotals()}.
 */
final readonly class NightRecord
{
    /**
     * @param  list<ScoreLine|TotalsLine>  $lines  the night's result lines, or the season's final lines
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
        public ?int $rounds = null,
    ) {}

    /**
     * A season known only by its final standings. It has no night, so its night id is 0, and no pot or place.
     *
     * @param  list<TotalsLine>  $lines
     */
    public static function seasonTotals(int $seasonId, int $rounds, array $lines): self
    {
        return new self(0, $seasonId, Money::zero(), Money::zero(), Money::zero(), null, $lines, rounds: $rounds);
    }

    /** Whether the record is a whole season known only by its final standings. */
    public function isSeasonTotals(): bool
    {
        return $this->rounds !== null;
    }
}
