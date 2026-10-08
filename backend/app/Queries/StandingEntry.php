<?php

namespace PTSite\App\Queries;

use PTSite\App\Models\Player;
use PTSite\Domain\Standings\StandingRow;

final readonly class StandingEntry
{
    /** @param  list<array{position: int, count: int}>  $positions  the times in each scoring position, zeros included */
    public function __construct(
        public int $rank,
        public Player $player,
        /** Total points, as a decimal string. */
        public string $points,
        public int $nightsScored,
        public int $wins,
        public array $positions = [],
    ) {}

    /** @return list<array{position: int, count: int}> a standing row's positions, as the API gives them */
    public static function positions(StandingRow $row): array
    {
        return array_map(fn (int $position, int $count) => ['position' => $position, 'count' => $count], array_keys($row->positions), $row->positions);
    }
}
