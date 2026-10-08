<?php

namespace PTSite\Domain\Statistics;

/** One player's line in the table of finishing positions. */
final readonly class PositionTableRow
{
    /** @param  array<int, int>  $counts  by scoring position, how often the player finished there; zeros included */
    public function __construct(
        public int $rank,
        public int $playerId,
        public array $counts,
    ) {}
}
