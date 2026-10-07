<?php

namespace PTSite\Domain\Standings;

use PTSite\Domain\Shared\Money;

final readonly class SimulatedRow
{
    public function __construct(
        public int $playerId,
        public ?int $currentRank,
        public Money $currentPoints,
        public int $simulatedRank,
        public Money $simulatedPoints,
        public Money $addedPoints,
    ) {}

    /** Places moved up (positive) or down (negative); null when the player was not ranked before. */
    public function movement(): ?int
    {
        return $this->currentRank === null ? null : $this->currentRank - $this->simulatedRank;
    }
}
