<?php

namespace PTSite\Domain\Calendar;

use DateTimeImmutable;

/** A holiday on a real date, worked out from the table and the year's exceptions. */
final readonly class Holiday
{
    /** @param  ?string  $key  the table holiday it comes from; null for a one-year extra */
    public function __construct(
        public DateTimeImmutable $date,
        public string $name,
        public ?string $key,
        public ?HolidayScope $scope,
    ) {}
}
