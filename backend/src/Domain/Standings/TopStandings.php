<?php

namespace PTSite\Domain\Standings;

/** The first rows of the standings. */
final readonly class TopStandings
{
    /**
     * @param  list<StandingRow>  $rows
     * @param  int  $tiedNotShown  rows left out that have the same total as the last row shown
     */
    public function __construct(
        public array $rows,
        public int $tiedNotShown,
    ) {}
}
