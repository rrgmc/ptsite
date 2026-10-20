<?php

namespace PTSite\App\Queries;

use PTSite\App\Models\Player;
use PTSite\App\Models\Season;
use PTSite\Domain\Statistics\PlayerResult;
use PTSite\Domain\Statistics\PlayerStatistics;

/**
 * The nights on which one player scored, in one season or in every season that is not archived, newest first.
 * They count the same nights as {@see StatisticsOfPlayer}. The player's page loads them apart, only when asked.
 */
final class ResultsOfPlayer
{
    public function __construct(
        private readonly PlayerStatistics $statistics,
        private readonly FinishedNights $finishedNights,
    ) {}

    /** @return list<PlayerNightResult> */
    public function __invoke(Player $player, ?Season $season): array
    {
        $nights = ($this->finishedNights)($season);
        $summary = $this->statistics->summarise($player->id, $this->finishedNights->records($nights));

        return array_map(fn (PlayerResult $result) => new PlayerNightResult(
            $result->nightId,
            $nights[$result->nightId]->starts_at->toIso8601String(),
            $result->seasonId,
            $nights[$result->nightId]->season->name,
            $result->position,
            $result->points->toDecimal(),
        ), $summary->results);
    }
}
