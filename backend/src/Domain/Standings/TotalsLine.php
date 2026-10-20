<?php

namespace PTSite\Domain\Standings;

use PTSite\Domain\Shared\Money;

/**
 * A player's final line of a season known only by its final standings: the total points, and how often the player
 * finished in each scoring position. It counts towards the standings like the result lines it stands for.
 */
final readonly class TotalsLine
{
    /** @param  array<int, int>  $positions  scoring position => times, from 1 */
    public function __construct(
        public int $playerId,
        public Money $points,
        public array $positions,
    ) {}

    /** The nights the player scored in: one for each finish. */
    public function nights(): int
    {
        return array_sum($this->positions);
    }
}
