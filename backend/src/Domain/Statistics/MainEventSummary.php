<?php

namespace PTSite\Domain\Statistics;

final readonly class MainEventSummary
{
    /**
     * @param  int  $count  how many Main Events were counted
     * @param  TopList  $titles  players by Main Events won
     * @param  TopList  $podiums  players by times in the first three of a Main Event
     * @param  TopList  $appearances  players by Main Events played
     */
    public function __construct(
        public int $count,
        public TopList $titles,
        public TopList $podiums,
        public TopList $appearances,
    ) {}
}
