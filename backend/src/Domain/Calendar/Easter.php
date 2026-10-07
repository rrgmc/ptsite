<?php

namespace PTSite\Domain\Calendar;

use DateTimeImmutable;

/**
 * Easter Sunday in the Gregorian calendar, by the anonymous Gregorian algorithm (Meeus/Jones/Butcher). Done by
 * hand so the site does not need PHP's `calendar` extension, which shared hosts may not have.
 */
final class Easter
{
    public static function sunday(int $year): DateTimeImmutable
    {
        $a = $year % 19;
        $b = intdiv($year, 100);
        $c = $year % 100;
        $d = intdiv($b, 4);
        $e = $b % 4;
        $f = intdiv($b + 8, 25);
        $g = intdiv($b - $f + 1, 3);
        $h = (19 * $a + $b - $d - $g + 15) % 30;
        $i = intdiv($c, 4);
        $k = $c % 4;
        $l = (32 + 2 * $e + 2 * $i - $h - $k) % 7;
        $m = intdiv($a + 11 * $h + 22 * $l, 451);
        $month = intdiv($h + $l - 7 * $m + 114, 31);
        $day = (($h + $l - 7 * $m + 114) % 31) + 1;

        return new DateTimeImmutable(sprintf('%04d-%02d-%02d', $year, $month, $day));
    }

    /** Carnival Tuesday: 47 days before Easter. */
    public static function carnivalTuesday(int $year): DateTimeImmutable
    {
        return self::sunday($year)->modify('-47 days');
    }
}
