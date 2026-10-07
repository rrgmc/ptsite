<?php

namespace PTSite\Domain\Calendar;

use DateTimeImmutable;

/**
 * The holidays of some years: every table holiday that happens in each year, minus that year's cancelled ones,
 * plus that year's extras.
 */
final class HolidayCalendar
{
    /** @var array<string, Holiday> by Y-m-d; the first holiday wins when two fall on the same day */
    private array $byDate = [];

    /**
     * @param  list<HolidayRule>  $rules
     * @param  list<HolidayException>  $exceptions
     * @param  list<int>  $years
     */
    public static function build(array $rules, array $exceptions, array $years): self
    {
        $calendar = new self;

        foreach ($years as $year) {
            $cancelled = [];
            foreach ($exceptions as $exception) {
                if ($exception->year === $year && $exception->isCancel()) {
                    $cancelled[$exception->cancelsKey] = true;
                }
            }
            foreach ($rules as $rule) {
                $date = $rule->dateIn($year);
                if ($date !== null && ! isset($cancelled[$rule->key])) {
                    $calendar->add(new Holiday($date, $rule->name, $rule->key, $rule->scope));
                }
            }
            foreach ($exceptions as $exception) {
                if ($exception->year === $year && ! $exception->isCancel()) {
                    $calendar->add(new Holiday($exception->date, (string) $exception->name, null, null));
                }
            }
        }
        ksort($calendar->byDate);

        return $calendar;
    }

    public function on(DateTimeImmutable $date): ?Holiday
    {
        return $this->byDate[$date->format('Y-m-d')] ?? null;
    }

    /** @return list<Holiday> in date order */
    public function all(): array
    {
        return array_values($this->byDate);
    }

    private function add(Holiday $holiday): void
    {
        $this->byDate[$holiday->date->format('Y-m-d')] ??= $holiday;
    }
}
