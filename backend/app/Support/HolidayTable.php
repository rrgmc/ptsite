<?php

namespace PTSite\App\Support;

use PTSite\App\Models\Holiday;
use PTSite\App\Models\HolidayException;
use PTSite\Domain\Calendar\HolidayCalendar;
use PTSite\Domain\Calendar\HolidayException as DomainException;
use PTSite\Domain\Calendar\HolidayRule;
use PTSite\Domain\Calendar\HolidayScope;

/** Turns the holiday rows into the domain's holiday rules and calendar. */
final class HolidayTable
{
    public static function rule(Holiday $holiday): HolidayRule
    {
        return $holiday->easter_offset !== null
            ? HolidayRule::easter((string) $holiday->id, $holiday->name, HolidayScope::from($holiday->scope), $holiday->easter_offset, $holiday->first_year, $holiday->last_year)
            : HolidayRule::fixed((string) $holiday->id, $holiday->name, HolidayScope::from($holiday->scope), (int) $holiday->month, (int) $holiday->day, $holiday->first_year, $holiday->last_year);
    }

    public static function exception(HolidayException $exception): DomainException
    {
        return $exception->holiday_id !== null
            ? DomainException::cancel($exception->year, (string) $exception->holiday_id)
            : DomainException::extra($exception->year, $exception->date->toDateTimeImmutable(), (string) $exception->name);
    }

    /** The calendar of the given years, from the holidays that are not archived and those years' exceptions. */
    public static function calendar(array $years): HolidayCalendar
    {
        return HolidayCalendar::build(
            Holiday::query()->notArchived()->orderBy('id')->get()->map(self::rule(...))->all(),
            HolidayException::query()->whereIn('year', $years)->get()->map(self::exception(...))->all(),
            $years,
        );
    }
}
