<?php

namespace PTSite\App\Queries;

final readonly class CalendarHoliday
{
    public function __construct(
        /** Y-m-d. */
        public string $date,
        public string $name,
        /** national, state or city; null for a one-year extra. */
        public ?string $scope,
        /** The table holiday it comes from; null for a one-year extra. */
        public ?int $holidayId,
        /** Cancelled for this year: kept in the list so it can be restored. */
        public bool $cancelled,
        /** The one-year change behind a cancelled holiday or an extra; delete it to undo. */
        public ?int $exceptionId,
    ) {}
}
