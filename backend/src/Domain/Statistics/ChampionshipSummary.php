<?php

namespace PTSite\Domain\Statistics;

final readonly class ChampionshipSummary
{
    /**
     * @param  int  $count  how many finished seasons were counted
     * @param  TopList  $titles  players by seasons finished in 1st place
     * @param  TopList  $podiums  players by seasons finished in the first three
     * @param  TopList  $appearances  players by seasons in whose standings they are
     */
    public function __construct(
        public int $count,
        public TopList $titles,
        public TopList $podiums,
        public TopList $appearances,
    ) {}
}
