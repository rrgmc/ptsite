<?php

namespace PTSite\App\Queries;

use PTSite\App\Models\Player;
use PTSite\Domain\Recaps\PlayerMoneyLine;

/** One player's rebuys and time chips in the season digest: over the season, and on the latest night. */
final readonly class SeasonDigestMoney
{
    public function __construct(
        public Player $player,
        public PlayerMoneyLine $season,
        public PlayerMoneyLine $latest,
    ) {}
}
