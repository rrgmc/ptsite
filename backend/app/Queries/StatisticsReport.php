<?php

namespace PTSite\App\Queries;

use PTSite\App\Models\Player;

/** The statistics of one season, or of every season, ready to show. See docs/specs/statistics.md. */
final readonly class StatisticsReport
{
    /**
     * @param  list<RankedList>  $positions  one list of players per finishing position
     * @param  list<array{night_id: ?int, starts_at: ?string, season_id: int, season_name: string}>  $progressSteps
     * @param  list<array{player: Player, points: list<string>}>  $progressSeries
     */
    public function __construct(
        /** Null for every season. */
        public ?int $seasonId,
        public int $nightsCount,
        /** A decimal string, as the two totals after it. */
        public string $potTotal,
        public string $mainEventPotTotal,
        public string $timeChipTotal,
        public RankedList $totalPoints,
        public RankedList $nightsScored,
        public array $positions,
        public RankedList $biggestPots,
        public RankedList $places,
        public array $progressSteps,
        public array $progressSeries,
        public int $winsNotShown,
    ) {}
}
