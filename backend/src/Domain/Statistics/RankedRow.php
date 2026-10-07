<?php

namespace PTSite\Domain\Statistics;

/** One line of a top list: a player, night or place (by id) with its value, a count or an amount in cents. */
final readonly class RankedRow
{
    public function __construct(
        public int $rank,
        public int $id,
        public int $value,
    ) {}
}
