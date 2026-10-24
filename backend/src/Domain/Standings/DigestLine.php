<?php

namespace PTSite\Domain\Standings;

use PTSite\Domain\Shared\Money;

/** One player's line of the season digest: the standing row, with how it moved on the latest night. */
final readonly class DigestLine
{
    /** @param  list<?int>  $form  the player's position on each of the latest nights, oldest first; null where they did not score */
    public function __construct(
        public StandingRow $row,
        public ?int $previousRank,
        public Money $pointsOnLatestNight,
        public Money $gapToLeader,
        public Money $gapToAbove,
        public array $form,
    ) {}
}
