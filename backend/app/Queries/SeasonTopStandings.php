<?php

namespace PTSite\App\Queries;

use PTSite\App\Models\Player;
use PTSite\App\Models\Season;

/** One season with the first rows of its standings and its Main Event champion. */
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
        /** The 1st place of the season's Main Event. */
        public ?Player $mainEventChampion = null,
    ) {}
}
