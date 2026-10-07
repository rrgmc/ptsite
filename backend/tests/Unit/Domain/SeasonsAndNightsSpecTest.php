<?php

/*
 * Mirrors the examples in docs/specs/seasons-and-nights.md.
 */

use PTSite\Domain\Nights\NightResult;
use PTSite\Domain\Nights\NightRules;
use PTSite\Domain\Nights\NightStatus;
use PTSite\Domain\Scoring\PercentageTable;
use PTSite\Domain\Shared\Money;
use PTSite\Domain\Shared\RuleViolation;

function result(array $positions, string $pot = '840.00', string $mainEventPot = '170.00', string $timeChip = '0'): NightResult
{
    return new NightResult(Money::fromDecimal($pot), Money::fromDecimal($mainEventPot), Money::fromDecimal($timeChip), $positions);
}

function violation(callable $fn): ?RuleViolation
{
    try {
        $fn();
    } catch (RuleViolation $e) {
        return $e;
    }

    return null;
}

it('refuses to open a night while another night of the season is open', function () {
    expect(violation(fn () => (new NightRules)->assertCanOpen(NightStatus::Scheduled, anotherNightIsOpen: true))?->rule)
        ->toBe('night.open.another_open');
});

it('opens a scheduled night when no other night is open', function () {
    expect(violation(fn () => (new NightRules)->assertCanOpen(NightStatus::Scheduled, anotherNightIsOpen: false)))->toBeNull();
});

it('only opens scheduled nights', function () {
    expect(violation(fn () => (new NightRules)->assertCanOpen(NightStatus::Finished, false))?->rule)
        ->toBe('night.open.not_scheduled');
});

it('finishes open nights and lets finished nights be corrected, but not scheduled ones', function () {
    $rules = new NightRules;
    expect(violation(fn () => $rules->assertCanFinish(NightStatus::Open)))->toBeNull()
        ->and(violation(fn () => $rules->assertCanFinish(NightStatus::Finished)))->toBeNull()
        ->and(violation(fn () => $rules->assertCanFinish(NightStatus::Scheduled))?->rule)->toBe('night.finish.not_open');
});

it('refuses the same player in two scoring positions', function () {
    $e = violation(fn () => (new NightRules)->assertValidResult(
        result([1 => 1, 2 => 2, 3 => 1, 4 => 4, 5 => 5, 6 => 6]),
        PercentageTable::standard(),
    ));

    expect($e?->rule)->toBe('night.result.duplicate_player')
        ->and($e?->field)->toBe('positions.3');
});

it('requires every scoring position and the pot', function (NightResult $result, string $rule) {
    expect(violation(fn () => (new NightRules)->assertValidResult($result, PercentageTable::standard()))?->rule)->toBe($rule);
})->with([
    'empty position' => [fn () => result([1 => 1, 2 => 2, 3 => 3, 4 => 4, 5 => 5]), 'night.result.position_empty'],
    'zero pot' => [fn () => result([1 => 1, 2 => 2, 3 => 3, 4 => 4, 5 => 5, 6 => 6], '0'), 'night.result.pot_required'],
    'negative Main Event pot' => [fn () => result([1 => 1, 2 => 2, 3 => 3, 4 => 4, 5 => 5, 6 => 6], '840.00', '-1'), 'night.result.main_event_pot_negative'],
    'negative time chip' => [fn () => result([1 => 1, 2 => 2, 3 => 3, 4 => 4, 5 => 5, 6 => 6], '840.00', '170.00', '-1'), 'night.result.time_chip_negative'],
]);

it('accepts a Main Event pot and a time chip of zero', function () {
    expect(violation(fn () => (new NightRules)->assertValidResult(
        result([1 => 1, 2 => 2, 3 => 3, 4 => 4, 5 => 5, 6 => 6], '840.00', '0', '0'),
        PercentageTable::standard(),
    )))->toBeNull();
});

it('takes a partial result only while the night is open', function (NightStatus $status, bool $archived, bool $allowed) {
    expect(violation(fn () => (new NightRules)->assertCanSavePartialResult($status, $archived))?->rule)
        ->toBe($allowed ? null : 'night.partial_result.not_open');
})->with([
    'scheduled' => [NightStatus::Scheduled, false, false],
    'open' => [NightStatus::Open, false, true],
    'finished' => [NightStatus::Finished, false, false],
    'open but archived' => [NightStatus::Open, true, false],
]);

it('accepts a partial result with empty positions, or with none', function () {
    $rules = new NightRules;

    expect(violation(fn () => $rules->assertValidPartialPositions([6 => 2], PercentageTable::standard())))->toBeNull()
        ->and(violation(fn () => $rules->assertValidPartialPositions([], PercentageTable::standard())))->toBeNull();
});

it('refuses the same player in two positions of a partial result', function () {
    $e = violation(fn () => (new NightRules)->assertValidPartialPositions([4 => 2, 6 => 2], PercentageTable::standard()));

    expect($e?->rule)->toBe('night.result.duplicate_player')
        ->and($e?->field)->toBe('positions.6')
        ->and($e?->context)->toBe(['position' => 6, 'other_position' => 4]);
});

it('refuses a partial result position outside the percentage table', function () {
    expect(violation(fn () => (new NightRules)->assertValidPartialPositions([7 => 2], PercentageTable::standard()))?->rule)
        ->toBe('night.result.too_many_positions');
});

it('moves or cancels only a scheduled night', function (NightStatus $status, bool $allowed) {
    $rules = new NightRules;

    expect(violation(fn () => $rules->assertCanReschedule($status))?->rule)->toBe($allowed ? null : 'night.reschedule.not_scheduled')
        ->and(violation(fn () => $rules->assertCanCancel($status))?->rule)->toBe($allowed ? null : 'night.cancel.not_scheduled');
})->with([
    'scheduled' => [NightStatus::Scheduled, true],
    'open' => [NightStatus::Open, false],
    'finished' => [NightStatus::Finished, false],
]);
