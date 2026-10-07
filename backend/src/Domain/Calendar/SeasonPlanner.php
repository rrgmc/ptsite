<?php

namespace PTSite\Domain\Calendar;

use DateTimeImmutable;
use PTSite\Domain\Nights\SchedulePattern;
use PTSite\Domain\Shared\RuleViolation;

/**
 * Plans a season's nights between two dates: the regular weekday every N weeks, at the regular time.
 *
 * The rhythm carries on from the season's nights: when the season already has a night before the start date, the
 * cadence continues from it. Every existing night in the range is shown as taken, on whatever day it is, and the
 * cadence carries on from it; a week that already has a night does not get another.
 *
 * A date is skipped when it is a holiday, when the day before is a holiday ("emenda"), or when it falls in the
 * Carnival weekend (the four days before Carnival Tuesday, while Carnival is a holiday that year). A skipped night
 * moves one week later. The admin can tick and untick any date afterwards; nothing here stops a night on a
 * holiday.
 */
final class SeasonPlanner
{
    /** A plan covers at most about 18 months. */
    private const MAX_DAYS = 550;

    /**
     * @param  list<DateTimeImmutable>  $existing  the season's nights (date and time), before and in the range
     * @param  ?int  $count  stop after this many planned nights (the rounds left), even before $to
     * @return list<PlannedNight> in date order
     */
    public function plan(SchedulePattern $pattern, DateTimeImmutable $from, DateTimeImmutable $to, HolidayCalendar $holidays, array $existing = [], ?int $count = null): array
    {
        $from = $from->setTime(0, 0);
        $to = $to->setTime(0, 0);
        if ($to < $from) {
            throw new RuleViolation('plan.range', 'to');
        }
        if ($from->diff($to)->days > self::MAX_DAYS) {
            throw new RuleViolation('plan.too_long', 'to');
        }
        if ($count !== null && $count < 1) {
            throw new RuleViolation('plan.count', 'count');
        }

        usort($existing, fn (DateTimeImmutable $a, DateTimeImmutable $b) => $a <=> $b);
        $before = array_values(array_filter($existing, fn ($n) => $n->setTime(0, 0) < $from));
        $inRange = array_values(array_filter($existing, fn ($n) => $n->setTime(0, 0) >= $from && $n->setTime(0, 0) <= $to));
        [$hour, $minute] = array_map('intval', explode(':', $pattern->time));
        $every = "+{$pattern->everyWeeks} weeks";

        if ($before !== []) {
            // Carry on the season's rhythm from its last night.
            $date = $this->regularDay($this->weekOf(end($before))->modify($every), $pattern);
            while ($date < $from) {
                $date = $date->modify($every);
            }
        } else {
            $date = $from->modify((($pattern->weekday - (int) $from->format('N') + 7) % 7).' days');
        }

        $plan = [];
        while ($date <= $to) {
            // An existing night up to this week is that cycle's night.
            if ($inRange !== [] && $this->weekOf($inRange[0]) <= $this->weekOf($date)) {
                $night = array_shift($inRange);
                $plan[] = new PlannedNight($night, included: false, taken: true);
                $date = $this->regularDay($this->weekOf($night)->modify($every), $pattern);

                continue;
            }

            $startsAt = $date->setTime($hour, $minute);
            [$kind, $holiday] = $this->skipReason($date, $holidays);
            if ($kind !== null) {
                $plan[] = new PlannedNight($startsAt, included: false, skipKind: $kind, holiday: $holiday);
                $date = $date->modify('+1 week');

                continue;
            }

            $plan[] = new PlannedNight($startsAt, included: true);
            $date = $date->modify($every);
            if ($count !== null && --$count === 0) {
                $to = $startsAt->setTime(0, 0); // the plan ends at the night that completes the rounds

                break;
            }
        }
        foreach ($inRange as $night) {
            if ($night->setTime(0, 0) <= $to) {
                $plan[] = new PlannedNight($night, included: false, taken: true);
            }
        }

        return $plan;
    }

    /** Monday of the date's week. */
    private function weekOf(DateTimeImmutable $date): DateTimeImmutable
    {
        return $date->setTime(0, 0)->modify('-'.((int) $date->format('N') - 1).' days');
    }

    /** The regular weekday in the week starting on the given Monday. */
    private function regularDay(DateTimeImmutable $monday, SchedulePattern $pattern): DateTimeImmutable
    {
        return $monday->modify('+'.($pattern->weekday - 1).' days');
    }

    /** @return array{?SkipKind, ?string} */
    private function skipReason(DateTimeImmutable $date, HolidayCalendar $holidays): array
    {
        if ($holiday = $holidays->on($date)) {
            return [SkipKind::Holiday, $holiday->name];
        }
        if ($holiday = $holidays->on($date->modify('-1 day'))) {
            return [SkipKind::Bridge, $holiday->name];
        }

        $carnival = Easter::carnivalTuesday((int) $date->format('Y'));
        $daysBefore = (int) $date->diff($carnival)->format('%r%a');
        if ($daysBefore >= 1 && $daysBefore <= 4 && ($holiday = $holidays->on($carnival))) {
            return [SkipKind::Carnival, $holiday->name];
        }

        return [null, null];
    }
}
