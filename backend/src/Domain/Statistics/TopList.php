<?php

namespace PTSite\Domain\Statistics;

/** The first rows of a ranking. */
final readonly class TopList
{
    /**
     * @param  list<RankedRow>  $rows
     * @param  int  $tiedNotShown  rows left out that have the same value as the last row shown
     */
    public function __construct(
        public array $rows,
        public int $tiedNotShown,
    ) {}
}
