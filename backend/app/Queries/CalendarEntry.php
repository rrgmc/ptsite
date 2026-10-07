<?php

namespace PTSite\App\Queries;

use PTSite\Domain\Calendar\SkipKind;

/** One day in a season calendar: a night, or a regular night that is not played ("Sem evento"). */
final readonly class CalendarEntry
{
    public function __construct(
        /** night or no_night. */
        public string $kind,
        /** ISO 8601 date and time with offset. */
        public string $startsAt,
        public ?int $nightId = null,
        /** scheduled, open or finished. */
        public ?string $status = null,
        public ?string $place = null,
        /** The 1st place of a finished night. */
        public ?string $winner = null,
        public ?string $pot = null,
        /** How many players answered ALL IN. */
        public int $allInCount = 0,
        /** The logged-in player's answer: all_in, fold or null. */
        public ?string $myAnswer = null,
        public ?SkipKind $skipKind = null,
        public ?string $holiday = null,
    ) {}
}
