<?php

namespace PTSite\App\Queries;

use PTSite\App\Models\SeasonTotal;
use PTSite\Domain\Shared\Money;
use PTSite\Domain\Standings\TotalsLine;

/** A stored final line of a season known only by its final standings, as the domain counts it. */
final class TotalsLines
{
    public static function of(SeasonTotal $total): TotalsLine
    {
        $counts = array_map('intval', array_values($total->positions));

        return new TotalsLine($total->player_id, Money::fromDecimal((string) $total->points), $counts === [] ? [] : array_combine(range(1, count($counts)), $counts));
    }
}
