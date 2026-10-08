<?php

namespace PTSite\App\Queries;

use Carbon\CarbonImmutable;
use PTSite\App\Models\Season;
use PTSite\Domain\Nights\NightSuggester;
use PTSite\Domain\Nights\SchedulePattern;

/**
 * Suggested dates for a new night of a season: the next three regular weekdays (docs/specs/seasons-and-nights.md).
 */
final class SuggestNightDates
{
    public function __construct(private readonly NightSuggester $suggester) {}

    /** @return list<SuggestedNight> */
    public function __invoke(Season $season, ?CarbonImmutable $today = null): array
    {
        $taken = $season->nights()->notArchived()->rounds()->pluck('starts_at')
            ->map(fn ($d) => CarbonImmutable::parse($d))->all();

        $suggestions = $this->suggester->suggest(
            SchedulePattern::of($season->schedule_weekday, $season->schedule_time),
            $today ?? CarbonImmutable::now(),
            CarbonImmutable::parse($season->starts_on),
            $taken,
        );

        return array_map(fn ($s) => new SuggestedNight(CarbonImmutable::instance($s->startsAt)->toIso8601String()), $suggestions);
    }
}
