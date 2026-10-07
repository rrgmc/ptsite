<?php

namespace PTSite\Domain\Calendar;

use DateTimeImmutable;
use PTSite\Domain\Shared\RuleViolation;

/**
 * A change to the holiday table for one year: a holiday that will not happen that year, or an extra one. Moving a
 * holiday is a cancel plus an extra.
 */
final readonly class HolidayException
{
    private function __construct(
        public int $year,
        public ?string $cancelsKey,
        public ?DateTimeImmutable $date,
        public ?string $name,
    ) {}

    public static function cancel(int $year, string $holidayKey): self
    {
        return new self($year, $holidayKey, null, null);
    }

    public static function extra(int $year, DateTimeImmutable $date, string $name): self
    {
        if ((int) $date->format('Y') !== $year) {
            throw new RuleViolation('holiday_exception.year', 'date');
        }

        return new self($year, null, $date->setTime(0, 0), $name);
    }

    public function isCancel(): bool
    {
        return $this->cancelsKey !== null;
    }
}
