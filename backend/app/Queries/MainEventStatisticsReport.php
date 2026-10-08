<?php

namespace PTSite\App\Queries;

/** The Main Event lists of the statistics, ready to show. See docs/specs/statistics.md. */
final readonly class MainEventStatisticsReport
{
    public function __construct(
        /** How many finished Main Events count. */
        public int $count,
        public RankedList $titles,
        public RankedList $podiums,
        public RankedList $appearances,
    ) {}
}
