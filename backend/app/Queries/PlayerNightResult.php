<?php

namespace PTSite\App\Queries;

/** A night on which a player scored, ready to show. See docs/specs/statistics.md, rule 11. */
final readonly class PlayerNightResult
{
    public function __construct(
        public int $nightId,
        public string $startsAt,
        public int $seasonId,
        public string $seasonName,
        public int $position,
        /** A decimal string. */
        public string $points,
    ) {}
}
