<?php

namespace PTSite\App\Queries;

use Carbon\CarbonImmutable;
use PTSite\App\Models\Season;
use PTSite\App\Support\HolidayTable;
use PTSite\Domain\Calendar\SeasonPlanner;
use PTSite\Domain\Nights\SchedulePattern;

/**
 * A season's nights between two dates, skipping holidays, emendas and Carnival (docs/specs/season-planner.md).
 * Nothing is saved.
 */
final class PlanSeasonNights
{
    public function __construct(private readonly SeasonPlanner $planner) {}

    /** @return list<PlannedDate> */
    public function __invoke(Season $season, CarbonImmutable $from, CarbonImmutable $to, ?int $count = null): array
    {
        // Every round of the season counts: the plan carries on its rhythm and shows the ones in the range.
        // An extra night is outside the calendar.
        $nights = $season->nights()->notArchived()->rounds()->pluck('id', 'starts_at')
            ->mapWithKeys(fn ($id, $startsAt) => [CarbonImmutable::parse($startsAt)->format('Y-m-d H:i:s') => $id]);
        // The year before counts too: 01/01 makes 02/01 an emenda.
        $years = range($from->year - 1, max($from->year, $to->year));

        $plan = $this->planner->plan(
            SchedulePattern::of($season->schedule_weekday, $season->schedule_time, $season->schedule_every_weeks),
            $from, $to, HolidayTable::calendar($years),
            $nights->keys()->map(fn ($d) => CarbonImmutable::parse($d))->all(),
            $count,
        );

        return array_map(fn ($n) => new PlannedDate(
            CarbonImmutable::instance($n->startsAt)->toIso8601String(),
            $n->included,
            $n->taken,
            $n->skipKind,
            $n->holiday,
            $n->taken ? $nights->get($n->startsAt->format('Y-m-d H:i:s')) : null,
        ), $plan);
    }
}
