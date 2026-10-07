<?php

namespace PTSite\App\Queries;

/** One player's statistics over one season, or over every season, ready to show. See docs/specs/statistics.md. */
final readonly class PlayerStatisticsReport
{
    /**
     * @param  list<array{position: int, count: int}>  $positions
     * @param  list<array{season_id: int, season_name: string, rank: int, points: string, nights_scored: int, wins: int}>  $seasons
     * @param  list<array{night_id: int, starts_at: string, season_id: int, season_name: string, position: int, points: string}>  $results
     * @param  list<array{night_id: ?int, starts_at: ?string, season_id: int, season_name: string}>  $progressSteps
     * @param  list<string>  $progressPoints
     */
    public function __construct(
        /** Null for every season. */
        public ?int $seasonId,
        /** Null when the player did not score. */
        public ?int $rank,
        /** A decimal string. */
        public string $points,
        public int $nightsScored,
        public int $wins,
        public array $positions,
        public array $seasons,
        public array $results,
        public array $progressSteps,
        public array $progressPoints,
    ) {}
}
