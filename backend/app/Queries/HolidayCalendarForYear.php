<?php

namespace PTSite\App\Queries;

use PTSite\App\Models\Holiday;
use PTSite\App\Models\HolidayException;
use PTSite\App\Support\HolidayTable;

/**
 * The holidays of one year, in date order: each table holiday that happens that year (marked when cancelled for
 * the year), plus the year's extras.
 */
final class HolidayCalendarForYear
{
    /** @return list<CalendarHoliday> */
    public function __invoke(int $year): array
    {
        $exceptions = HolidayException::query()->where('year', $year)->get();
        $cancelled = $exceptions->whereNotNull('holiday_id')->keyBy('holiday_id');

        $rows = [];
        foreach (Holiday::query()->notArchived()->orderBy('id')->get() as $holiday) {
            $date = HolidayTable::rule($holiday)->dateIn($year);
            if ($date !== null) {
                $exception = $cancelled->get($holiday->id);
                $rows[] = new CalendarHoliday($date->format('Y-m-d'), $holiday->name, $holiday->scope, $holiday->id, $exception !== null, $exception?->id);
            }
        }
        foreach ($exceptions->whereNull('holiday_id') as $extra) {
            $rows[] = new CalendarHoliday($extra->date->toDateString(), (string) $extra->name, null, null, false, $extra->id);
        }
        usort($rows, fn ($a, $b) => [$a->date, $a->name] <=> [$b->date, $b->name]);

        return $rows;
    }
}
