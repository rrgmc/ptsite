<?php

namespace PTSite\App\Queries;

use PTSite\App\Models\Night;
use PTSite\App\Models\Season;
use PTSite\App\Models\SeasonRecap;
use PTSite\Domain\Shared\Money;

final readonly class SeasonDigestData
{
    /**
     * @param  list<SeasonDigestEntry>  $lines
     * @param  list<SeasonRecap>  $recaps  the latest published recaps, newest first
     * @param  ?Money  $timeChipTotal  the time chips of the season's finished nights; null on a site with no time chip
     * @param  ?list<SeasonDigestMoney>  $money  who bought rebuys and time chips, the most first; null on a site with no night dashboard
     */
    public function __construct(
        public Season $season,
        public int $roundsPlayed,
        public int $extraNightsPlayed,
        public ?Night $latestNight,
        public ?Night $nextNight,
        public array $lines,
        public array $recaps,
        public ?Money $timeChipTotal = null,
        public ?array $money = null,
    ) {}
}
