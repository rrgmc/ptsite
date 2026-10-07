<?php

namespace PTSite\Domain\Nights;

use PTSite\Domain\Shared\RuleViolation;

/**
 * A season's regular night: the weekday, the start time and how many weeks apart the nights are. It only drives
 * suggestions and the season planner; any night can still be scheduled on another day or time.
 */
final readonly class SchedulePattern
{
    /**
     * @param  int  $weekday  ISO weekday: 1 = Monday … 5 = Friday … 7 = Sunday
     * @param  string  $time  "HH:MM", 24-hour
     * @param  int  $everyWeeks  1 = every week, 2 = every other week … up to 4
     */
    private function __construct(
        public int $weekday,
        public string $time,
        public int $everyWeeks,
    ) {}

    public static function of(int $weekday, string $time, int $everyWeeks = 1): self
    {
        if ($weekday < 1 || $weekday > 7) {
            throw new RuleViolation('schedule.weekday', 'schedule_weekday');
        }
        if (! preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $time)) {
            throw new RuleViolation('schedule.time', 'schedule_time');
        }
        if ($everyWeeks < 1 || $everyWeeks > 4) {
            throw new RuleViolation('schedule.every_weeks', 'schedule_every_weeks');
        }

        return new self($weekday, $time, $everyWeeks);
    }

    /** Friday at 21:00, every other week: a common regular night. */
    public static function standard(): self
    {
        return self::of(5, '21:00', 2);
    }
}
