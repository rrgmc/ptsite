<?php

namespace PTSite\App\Queries;

/** The "Campeonatos" lists of the statistics, ready to show. See docs/specs/statistics.md. */
final readonly class ChampionshipStatisticsReport
{
    public function __construct(
        /** How many finished seasons count. */
        public int $count,
        public RankedList $titles,
        public RankedList $podiums,
        public RankedList $appearances,
    ) {}
}
