<?php

namespace PTSite\App\Queries;

use PTSite\App\Models\Place;
use PTSite\App\Models\Player;
use PTSite\App\Models\Season;
use PTSite\Domain\Shared\Money;
use PTSite\Domain\Statistics\RankedRow;
use PTSite\Domain\Statistics\Statistics;
use PTSite\Domain\Statistics\TopList;

/**
 * The statistics of one season, or of every season that is not archived, calculated from the finished,
 * non-archived nights. Nothing is stored: a corrected result changes them at once.
 */
final class LeagueStatistics
{
    public function __construct(
        private readonly Statistics $statistics,
        private readonly FinishedNights $finishedNights,
    ) {}

    public function __invoke(?Season $season): StatisticsReport
    {
        $nights = ($this->finishedNights)($season);

        $summary = $this->statistics->summarise($this->finishedNights->records($nights), stepPerSeason: $season === null);

        $playerLists = [$summary->totalPoints, $summary->nightsScored, ...$summary->positions];
        $players = Player::query()->findMany([
            ...array_merge(...array_map(fn (TopList $list) => array_map(fn (RankedRow $row) => $row->id, $list->rows), $playerLists)),
            ...array_keys($summary->progress->totals),
        ])->keyBy('id');
        $places = Place::query()->findMany(array_map(fn (RankedRow $row) => $row->id, $summary->places->rows))->keyBy('id');

        $counted = fn (TopList $list, ?int $position = null) => new RankedList(
            array_map(fn (RankedRow $row) => new RankedEntry($row->rank, player: $players[$row->id], count: $row->value), $list->rows),
            $list->tiedNotShown,
            $position,
        );

        return new StatisticsReport(
            $season?->id,
            $summary->nightsCount,
            $summary->potTotal->toDecimal(),
            $summary->mainEventPotTotal->toDecimal(),
            $summary->timeChipTotal->toDecimal(),
            new RankedList(
                array_map(fn (RankedRow $row) => new RankedEntry($row->rank, player: $players[$row->id], amount: Money::cents($row->value)->toDecimal()), $summary->totalPoints->rows),
                $summary->totalPoints->tiedNotShown,
            ),
            $counted($summary->nightsScored),
            array_map($counted, array_values($summary->positions), array_keys($summary->positions)),
            new RankedList(
                array_map(fn (RankedRow $row) => new RankedEntry($row->rank, night: $nights[$row->id], amount: Money::cents($row->value)->toDecimal()), $summary->biggestPots->rows),
                $summary->biggestPots->tiedNotShown,
            ),
            new RankedList(
                array_map(fn (RankedRow $row) => new RankedEntry($row->rank, place: $places[$row->id], count: $row->value), $summary->places->rows),
                $summary->places->tiedNotShown,
            ),
            $this->finishedNights->steps($summary->progress->steps, $nights, $season === null),
            array_map(
                fn (int $playerId, array $totals) => ['player' => $players[$playerId], 'points' => array_map(fn (Money $m) => $m->toDecimal(), $totals)],
                array_keys($summary->progress->totals),
                array_values($summary->progress->totals),
            ),
            $summary->winsNotShown,
        );
    }
}
