<?php

namespace PTSite\Domain\Calendar;

use DateTimeImmutable;

/**
 * One date in a season plan. Included dates are ticked for scheduling; skipped ones carry the reason; taken ones
 * already have a night in the season.
 */
final readonly class PlannedNight
{
    public function __construct(
        public DateTimeImmutable $startsAt,
        public bool $included,
        public bool $taken = false,
        public ?SkipKind $skipKind = null,
        public ?string $holiday = null,
    ) {}
}
