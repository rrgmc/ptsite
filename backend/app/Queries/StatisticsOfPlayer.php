<?php

namespace PTSite\App\Queries;

use PTSite\App\Models\Player;
use PTSite\App\Models\Season;
use PTSite\Domain\Shared\Money;
use PTSite\Domain\Statistics\NightRecord;
use PTSite\Domain\Statistics\PlayerResult;
use PTSite\Domain\Statistics\PlayerSeasonRow;
use PTSite\Domain\Statistics\PlayerStatistics;

/**
 * One player's statistics over one season, or over every season that is not archived. They count the same
 * nights as {@see LeagueStatistics}, and nothing is stored either.
 */
final class StatisticsOfPlayer
{
    public function __construct(
        private readonly PlayerStatistics $statistics,
        private readonly FinishedNights $finishedNights,
    ) {}

    public function __invoke(Player $player, ?Season $season): PlayerStatisticsReport
    {
        $nights = ($this->finishedNights)($season);
        $totalsSeasons = $this->finishedNights->totalsSeasons($season);
        $seasonNames = $nights->pluck('season.name', 'season_id')->union($totalsSeasons->pluck('name', 'id'));

        $records = $this->finishedNights->records($nights, totalsSeasons: $totalsSeasons);
        $summary = $this->statistics->summarise($player->id, $records, stepPerSeason: $season === null);
        $ranksWithMainEvent = $this->ranksWithMainEvent($player, $season, $records);

        return new PlayerStatisticsReport(
            $season?->id,
            $summary->rank,
            $summary->points->toDecimal(),
            $summary->nightsScored,
            $summary->wins,
            array_map(fn (int $position, int $count) => ['position' => $position, 'count' => $count], array_keys($summary->positions), array_values($summary->positions)),
            array_map(fn (PlayerSeasonRow $row) => [
                'season_id' => $row->seasonId,
                'season_name' => $seasonNames[$row->seasonId],
                'rank' => $row->rank,
                'points' => $row->points->toDecimal(),
                'nights_scored' => $row->nightsScored,
                'wins' => $row->wins,
                'rank_with_main_event' => $ranksWithMainEvent[$row->seasonId] ?? $row->rank,
            ], $summary->seasons),
            array_map(fn (PlayerResult $result) => [
                'night_id' => $result->nightId,
                'starts_at' => $nights[$result->nightId]->starts_at->toIso8601String(),
                'season_id' => $result->seasonId,
                'season_name' => $seasonNames[$result->seasonId],
                'position' => $result->position,
                'points' => $result->points->toDecimal(),
            ], $summary->results),
            $this->finishedNights->steps($summary->progressSteps, $nights, $season === null, $totalsSeasons),
            array_map(fn (Money $total) => $total->toDecimal(), $summary->progress),
        );
    }

    /**
     * The player's rank in each season with its Main Event counted as one more night, for fun.
     *
     * @param  list<NightRecord>  $records
     * @return array<int, int> season id => rank
     */
    private function ranksWithMainEvent(Player $player, ?Season $season, array $records): array
    {
        $mainEvents = $this->finishedNights->mainEventRecords($season, $records);
        if ($mainEvents === []) {
            return [];
        }

        $ranks = [];
        foreach ($this->statistics->summarise($player->id, [...$records, ...$mainEvents])->seasons as $row) {
            $ranks[$row->seasonId] = $row->rank;
        }

        return $ranks;
    }
}
