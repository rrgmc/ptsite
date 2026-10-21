<?php

namespace PTSite\App\Queries;

use Illuminate\Support\Collection;
use PTSite\App\Models\Night;
use PTSite\App\Models\Place;
use PTSite\App\Models\Player;
use PTSite\App\Models\Season;
use PTSite\App\Models\SeasonTotal;
use PTSite\Domain\Features\Feature;
use PTSite\Domain\Features\Features;
use PTSite\Domain\Shared\Money;
use PTSite\Domain\Standings\ScoreLine;
use PTSite\Domain\Standings\Standings;
use PTSite\Domain\Statistics\ChampionshipStatistics;
use PTSite\Domain\Statistics\ChampionshipSummary;
use PTSite\Domain\Statistics\MainEventStatistics;
use PTSite\Domain\Statistics\MainEventSummary;
use PTSite\Domain\Statistics\PositionTableRow;
use PTSite\Domain\Statistics\RankedRow;
use PTSite\Domain\Statistics\Statistics;
use PTSite\Domain\Statistics\TopList;

/**
 * The statistics of one season, or of every season that is not archived, calculated from the finished,
 * non-archived nights. Nothing is stored: a corrected result changes them at once. On a site with the Main
 * Event, the finished Main Events of the same seasons give lists of their own; on a site with the night dashboard,
 * so do the rebuys and the time chips it recorded. Over every season, the final standings of the finished seasons
 * give the "Campeonatos" lists.
 */
final class LeagueStatistics
{
    public function __construct(
        private readonly Statistics $statistics,
        private readonly FinishedNights $finishedNights,
        private readonly MainEventStatistics $mainEventStatistics,
        private readonly ChampionshipStatistics $championshipStatistics,
        private readonly Standings $standings,
        private readonly Features $features,
    ) {}

    public function __invoke(?Season $season): StatisticsReport
    {
        $nights = ($this->finishedNights)($season);
        $totalsSeasons = $this->finishedNights->totalsSeasons($season);

        $dashboard = $this->features->enabled(Feature::NightDashboard);
        $timeChip = $dashboard && $this->features->enabled(Feature::TimeChip);
        $records = $this->finishedNights->records($nights, withDashboard: $dashboard, totalsSeasons: $totalsSeasons);
        $summary = $this->statistics->summarise($records, stepPerSeason: $season === null);
        // Over every season, the leaders' position in each season, with its Main Event counted for fun.
        $seasonRanks = $season === null ? $this->statistics->seasonRanks(
            [...$records, ...$this->finishedNights->mainEventRecords(null, $records)],
            $summary->progress->steps,
            $summary->rankLeaders,
        ) : null;
        $mainEvent = $this->features->enabled(Feature::MainEvent) ? $this->mainEvent($season) : null;
        $championships = $season === null ? $this->championships($nights, $totalsSeasons) : null;

        $playerLists = [
            $summary->totalPoints, $summary->nightsScored, ...$summary->positions,
            ...($mainEvent ? [$mainEvent->titles, $mainEvent->podiums] : []),
            ...($championships ? [$championships->titles, $championships->podiums, $championships->appearances] : []),
            ...($dashboard ? [$summary->rebuys, $summary->moneyOnlyRebuys, $summary->timeChips] : []),
        ];
        $players = Player::query()->findMany([
            ...array_merge(...array_map(fn (TopList $list) => array_map(fn (RankedRow $row) => $row->id, $list->rows), $playerLists)),
            ...array_keys($summary->progress->totals),
            ...($seasonRanks === null ? [] : $summary->rankLeaders),
            ...array_map(fn (PositionTableRow $row) => $row->playerId, $summary->positionTable),
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
            $this->finishedNights->steps($summary->progress->steps, $nights, $season === null, $totalsSeasons),
            array_map(
                fn (int $playerId, array $totals) => ['player' => $players[$playerId], 'points' => array_map(fn (Money $m) => $m->toDecimal(), $totals)],
                array_keys($summary->progress->totals),
                array_values($summary->progress->totals),
            ),
            array_map(fn (Money $pot) => $pot->toDecimal(), $summary->progress->pots),
            $summary->winsNotShown,
            array_map(fn (PositionTableRow $row) => [
                'rank' => $row->rank,
                'player' => $players[$row->playerId],
                'positions' => array_map(fn (int $position, int $count) => ['position' => $position, 'count' => $count], array_keys($row->counts), $row->counts),
            ], $summary->positionTable),
            $mainEvent ? new MainEventStatisticsReport(
                $mainEvent->count,
                $counted($mainEvent->titles),
                $counted($mainEvent->podiums),
            ) : null,
            $championships ? new ChampionshipStatisticsReport(
                $championships->count,
                $counted($championships->titles),
                $counted($championships->podiums),
                $counted($championships->appearances),
            ) : null,
            $dashboard ? new RebuyStatisticsReport(
                $summary->rebuyCount,
                $counted($summary->rebuys),
                $summary->moneyOnlyRebuyCount,
                $counted($summary->moneyOnlyRebuys),
                $timeChip ? $summary->timeChipCount : null,
                $timeChip ? $counted($summary->timeChips) : null,
                $summary->progress->rebuys,
                $timeChip ? $summary->progress->timeChips : null,
            ) : null,
            $seasonRanks === null ? null : array_map(
                fn (int $playerId, array $ranks) => ['player' => $players[$playerId], 'ranks' => $ranks],
                array_keys($seasonRanks),
                array_values($seasonRanks),
            ),
        );
    }

    /**
     * The final standings of the finished seasons among the nights counted, and of the finished seasons known only
     * by their final standings. A finished season with no finished night has no standings, so it does not count.
     *
     * @param  Collection<int, Night>  $nights  the result of FinishedNights, with their results and season
     * @param  Collection<int, Season>  $totalsSeasons  the result of FinishedNights::totalsSeasons()
     */
    private function championships(Collection $nights, Collection $totalsSeasons): ChampionshipSummary
    {
        $lines = [];
        foreach ($nights as $night) {
            if ($night->season->is_finished) {
                foreach ($night->results as $line) {
                    $lines[$night->season_id][] = new ScoreLine($line->player_id, Money::fromDecimal((string) $line->points), $line->position);
                }
            }
        }
        foreach ($totalsSeasons->where('is_finished', true) as $totalsSeason) {
            foreach ($totalsSeason->totals as $total) {
                /** @var SeasonTotal $total */
                $lines[$totalsSeason->id][] = TotalsLines::of($total);
            }
        }

        return $this->championshipStatistics->summarise(array_values(array_map(fn (array $season) => $this->standings->rank($season), $lines)));
    }

    private function mainEvent(?Season $season): MainEventSummary
    {
        return $this->mainEventStatistics->summarise(
            $this->finishedNights->mainEvents($season)
                ->map(fn (Night $night) => $night->mainEventPositions->pluck('player_id')->all())
                ->values()
                ->all(),
        );
    }
}
