<?php

namespace PTSite\App\Queries;

use Carbon\CarbonImmutable;
use PTSite\App\Models\Night;
use PTSite\App\Models\Season;
use PTSite\App\Models\User;
use PTSite\App\Support\HolidayTable;
use PTSite\Domain\Calendar\PlannedNight;
use PTSite\Domain\Calendar\SeasonPlanner;
use PTSite\Domain\Nights\SchedulePattern;

/**
 * A season's calendar (docs/specs/season-calendar.md): its nights, and the regular nights left out because of a
 * holiday, an emenda or Carnival. The left-out days come from the same walk as the season planner.
 */
final class SeasonCalendar
{
    /** The planner walks at most about 18 months at a time. */
    private const CHUNK_DAYS = 365;

    public function __construct(private readonly SeasonPlanner $planner) {}

    /** @return list<CalendarEntry> in date order */
    public function __invoke(Season $season, User $user): array
    {
        $nights = $season->nights()->notArchived()
            ->with(['place', 'results' => fn ($q) => $q->where('position', 1)->with('player')])
            ->with(['attendances' => fn ($q) => $q->where('player_id', $user->player_id ?? 0)])
            ->withCount(['attendances as all_in_count' => fn ($q) => $q->where('answer', 'all_in')])
            ->orderBy('starts_at')
            ->get();

        $entries = $nights->map(fn (Night $n) => new CalendarEntry(
            kind: 'night',
            startsAt: $n->starts_at->toIso8601String(),
            nightId: $n->id,
            status: $n->status,
            place: $n->place?->name,
            winner: $n->status === 'finished' ? $n->results->first()?->player?->nickname : null,
            pot: $n->status === 'finished' ? $n->pot : null,
            allInCount: (int) $n->all_in_count,
            myAnswer: $n->attendances->first()?->answer,
        ))->all();

        foreach ($this->leftOut($season, $nights->pluck('starts_at')->map(fn ($d) => CarbonImmutable::instance($d))->all()) as $n) {
            $entries[] = new CalendarEntry(
                kind: 'no_night',
                startsAt: CarbonImmutable::instance($n->startsAt)->toIso8601String(),
                skipKind: $n->skipKind,
                holiday: $n->holiday,
            );
        }
        usort($entries, fn ($a, $b) => $a->startsAt <=> $b->startsAt);

        return $entries;
    }

    /**
     * The season's regular nights left out, from its start to the later of its last night and the end of the start
     * year; a finished season stops at its last night.
     *
     * @param  list<CarbonImmutable>  $nights
     * @return list<PlannedNight>
     */
    private function leftOut(Season $season, array $nights): array
    {
        $from = CarbonImmutable::parse($season->starts_on)->startOfDay();
        $last = $nights === [] ? null : max($nights)->startOfDay();
        $to = $season->is_finished ? ($last ?? $from) : max($last ?? $from, $from->endOfYear()->startOfDay());
        $holidays = HolidayTable::calendar(range($from->year - 1, $to->year));
        $pattern = SchedulePattern::of($season->schedule_weekday, $season->schedule_time, $season->schedule_every_weeks);

        $leftOut = [];
        for ($start = $from; $start <= $to; $start = $end->addDay()) {
            $end = min($start->addDays(self::CHUNK_DAYS - 1), $to);
            foreach ($this->planner->plan($pattern, $start, $end, $holidays, $nights) as $n) {
                if ($n->skipKind !== null) {
                    $leftOut[] = $n;
                }
            }
        }

        return $leftOut;
    }
}
