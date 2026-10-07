<?php

namespace PTSite\App\Queries;

/** A top ten list of the statistics. */
final readonly class RankedList
{
    /**
     * @param  list<RankedEntry>  $rows
     * @param  int  $tiedNotShown  rows left out that are tied with the last row
     * @param  ?int  $position  the finishing position, for a "Posição" list
     */
    public function __construct(
        public array $rows,
        public int $tiedNotShown,
        public ?int $position = null,
    ) {}
}
