<?php

namespace PTSite\Domain\Nights;

use DateTimeImmutable;

/**
 * Suggests dates for a new night: the next three of the season's regular weekday, at its regular time, starting
 * today (or at the season start, if later). Nights are usually created early in the week, so the first
 * suggestion is normally that week's night. Dates that already have a night in the season are left out.
 * Holidays are not handled; the person scheduling can always pick another date.
 */
final class NightSuggester
{
    private const COUNT = 3;

    /**
     * @param  list<DateTimeImmutable>  $takenDates  dates of the season's existing nights
     * @return list<NightSuggestion>
     */
    public function suggest(SchedulePattern $pattern, DateTimeImmutable $today, DateTimeImmutable $seasonStart, array $takenDates = []): array
    {
        $taken = array_flip(array_map(fn (DateTimeImmutable $d) => $d->format('Y-m-d'), $takenDates));
        [$hour, $minute] = array_map('intval', explode(':', $pattern->time));

        $from = max($today->setTime(0, 0), $seasonStart->setTime(0, 0));
        $date = $from->modify((($pattern->weekday - (int) $from->format('N') + 7) % 7).' days');

        $suggestions = [];
        while (count($suggestions) < self::COUNT) {
            if (! isset($taken[$date->format('Y-m-d')])) {
                $suggestions[] = new NightSuggestion($date->setTime($hour, $minute));
            }
            $date = $date->modify('+1 week');
        }

        return $suggestions;
    }
}
