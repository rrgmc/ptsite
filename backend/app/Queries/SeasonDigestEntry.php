<?php

namespace PTSite\App\Queries;

use PTSite\App\Models\Player;
use PTSite\Domain\Standings\DigestLine;

final readonly class SeasonDigestEntry
{
    public function __construct(
        public DigestLine $line,
        public Player $player,
    ) {}
}
