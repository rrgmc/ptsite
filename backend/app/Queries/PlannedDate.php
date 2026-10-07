<?php

namespace PTSite\App\Queries;

use PTSite\Domain\Calendar\SkipKind;

final readonly class PlannedDate
{
    public function __construct(
        /** ISO 8601 date and time with offset. */
        public string $startsAt,
        /** Ticked for scheduling. */
        public bool $included,
        /** The season already has a night on this date. */
        public bool $taken,
        /** Why the date is left out: holiday, bridge (the day before is a holiday) or carnival. */
        public ?SkipKind $skipKind,
        /** The holiday behind the skip. */
        public ?string $holiday,
        /** The existing night, for taken dates. */
        public ?int $nightId = null,
    ) {}
}
