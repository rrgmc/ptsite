<?php

namespace PTSite\App\Queries;

use PTSite\App\Models\Season;

/** One season with the first rows of its standings. */
final readonly class SeasonTopStandings
{
    /**
     * @param  list<StandingEntry>  $rows
     * @param  int  $tiedNotShown  players left out who have the same total as the last one shown
     */
    public function __construct(
        public Season $season,
        public array $rows,
        public int $tiedNotShown,
    ) {}
}
