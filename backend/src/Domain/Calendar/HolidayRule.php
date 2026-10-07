<?php

namespace PTSite\Domain\Calendar;

use DateTimeImmutable;
use PTSite\Domain\Shared\RuleViolation;

/**
 * A holiday in the table: either on a fixed day and month (Tiradentes, 21/04) or a number of days after Easter
 * Sunday (Sexta-feira Santa, −2). It can be limited to a range of years (Consciência Negra is national from 2024).
 */
final readonly class HolidayRule
{
    private function __construct(
        public string $key,
        public string $name,
        public HolidayScope $scope,
        public ?int $month,
        public ?int $day,
        public ?int $easterOffset,
        public ?int $firstYear,
        public ?int $lastYear,
    ) {}

    public static function fixed(string $key, string $name, HolidayScope $scope, int $month, int $day, ?int $firstYear = null, ?int $lastYear = null): self
    {
        // 2024 is a leap year, so 29/02 is accepted; in other years it simply does not happen.
        if (! checkdate($month, $day, 2024)) {
            throw new RuleViolation('holiday.date', 'day');
        }
        self::assertYears($firstYear, $lastYear);

        return new self($key, $name, $scope, $month, $day, null, $firstYear, $lastYear);
    }

    public static function easter(string $key, string $name, HolidayScope $scope, int $offset, ?int $firstYear = null, ?int $lastYear = null): self
    {
        if ($offset < -100 || $offset > 100) {
            throw new RuleViolation('holiday.easter_offset', 'easter_offset');
        }
        self::assertYears($firstYear, $lastYear);

        return new self($key, $name, $scope, null, null, $offset, $firstYear, $lastYear);
    }

    /** The date of this holiday in the given year, or null when it does not happen that year. */
    public function dateIn(int $year): ?DateTimeImmutable
    {
        if (($this->firstYear !== null && $year < $this->firstYear) || ($this->lastYear !== null && $year > $this->lastYear)) {
            return null;
        }
        if ($this->easterOffset !== null) {
            return Easter::sunday($year)->modify(sprintf('%+d days', $this->easterOffset));
        }
        if (! checkdate((int) $this->month, (int) $this->day, $year)) {
            return null;
        }

        return new DateTimeImmutable(sprintf('%04d-%02d-%02d', $year, $this->month, $this->day));
    }

    private static function assertYears(?int $firstYear, ?int $lastYear): void
    {
        if ($firstYear !== null && $lastYear !== null && $firstYear > $lastYear) {
            throw new RuleViolation('holiday.years', 'last_year');
        }
    }
}
