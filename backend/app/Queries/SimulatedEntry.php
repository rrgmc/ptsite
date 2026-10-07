<?php

namespace PTSite\App\Queries;

use PTSite\App\Models\Player;

final readonly class SimulatedEntry
{
    public function __construct(
        public Player $player,
        public ?int $currentRank,
        public string $currentPoints,
        public int $simulatedRank,
        public string $simulatedPoints,
        public string $addedPoints,
        /** Places moved up (positive) or down (negative); null if the player was not ranked before. */
        public ?int $movement,
    ) {}
}
