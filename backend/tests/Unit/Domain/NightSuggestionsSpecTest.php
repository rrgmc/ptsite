<?php

/*
 * Mirrors the suggested-dates examples in docs/specs/seasons-and-nights.md.
 * The season's regular night is Friday at 21:30.
 */

use PTSite\Domain\Nights\NightSuggester;
use PTSite\Domain\Nights\SchedulePattern;
use PTSite\Domain\Shared\RuleViolation;

function suggest(string $today, array $taken = [], string $seasonStart = '2025-01-01'): array
{
    $rows = (new NightSuggester)->suggest(
        SchedulePattern::of(5, '21:30'),
        new DateTimeImmutable($today),
        new DateTimeImmutable($seasonStart),
        array_map(fn ($d) => new DateTimeImmutable($d), $taken),
    );

    return array_map(fn ($s) => $s->startsAt->format('d/m H:i'), $rows);
}

it('suggests the next three Fridays, starting with this week\'s when created on Monday', function () {
    expect(suggest('2025-03-24'))->toBe(['28/03 21:30', '04/04 21:30', '11/04 21:30']);
});

it('includes today when today is the regular weekday', function () {
    expect(suggest('2025-03-28'))->toBe(['28/03 21:30', '04/04 21:30', '11/04 21:30']);
});

it('starts with next week\'s Friday once this week\'s has passed', function () {
    expect(suggest('2025-03-29'))->toBe(['04/04 21:30', '11/04 21:30', '18/04 21:30']);
});

it('leaves out Fridays that already have a night in the season', function () {
    expect(suggest('2025-03-24', taken: ['2025-03-28 21:30']))->toBe(['04/04 21:30', '11/04 21:30', '18/04 21:30']);
});

it('starts at the season start when it is later than today', function () {
    expect(suggest('2025-03-20', seasonStart: '2025-04-01'))->toBe(['04/04 21:30', '11/04 21:30', '18/04 21:30']);
});

it('refuses an invalid regular night', function (int $weekday, string $time, string $rule) {
    expect(fn () => SchedulePattern::of($weekday, $time))->toThrow(RuleViolation::class, $rule);
})->with([
    'weekday 8' => [8, '21:00', 'schedule.weekday'],
    'time 25:00' => [5, '25:00', 'schedule.time'],
]);
