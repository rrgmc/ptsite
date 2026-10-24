<?php

namespace PTSite\App\Queries;

use PTSite\App\Models\Night;
use PTSite\App\Models\Season;
use PTSite\App\Models\SeasonRecap;

final readonly class SeasonDigestData
{
    /**
     * @param  list<SeasonDigestEntry>  $lines
     * @param  list<SeasonRecap>  $recaps  the latest published recaps, newest first
     */
    public function __construct(
        public Season $season,
        public int $roundsPlayed,
        public int $extraNightsPlayed,
        public ?Night $latestNight,
        public ?Night $nextNight,
        public array $lines,
        public array $recaps,
    ) {}
}
