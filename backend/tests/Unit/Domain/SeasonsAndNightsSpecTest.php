<?php

/*
 * Mirrors the examples in docs/specs/seasons-and-nights.md.
 */

use PTSite\Domain\Features\Features;
use PTSite\Domain\Nights\NightResult;
use PTSite\Domain\Nights\NightRules;
use PTSite\Domain\Nights\NightStatus;
use PTSite\Domain\Scoring\PercentageTable;
use PTSite\Domain\Seasons\SeasonMoney;
use PTSite\Domain\Shared\Money;
use PTSite\Domain\Shared\RuleViolation;

function result(array $positions, string $pot = '840.00', ?string $mainEventPot = '170.00', ?string $timeChip = '0'): NightResult
{
    $amount = fn (?string $value) => $value === null ? null : Money::fromDecimal($value);

    return new NightResult(Money::fromDecimal($pot), $amount($mainEventPot), $amount($timeChip), $positions);
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

it('takes no Main Event pot and no time chip on a site that has neither', function (?string $mainEventPot, ?string $timeChip, ?string $rule) {
    $features = new Features(['mainEventPot' => false, 'timeChip' => false]);

    expect(violation(fn () => (new NightRules)->assertValidResult(
        result([1 => 1, 2 => 2, 3 => 3, 4 => 4, 5 => 5, 6 => 6], '840.00', $mainEventPot, $timeChip),
        PercentageTable::standard(),
        $features,
    ))?->rule)->toBe($rule);
})->with([
    'neither' => [null, null, null],
    'a Main Event pot' => ['170.00', null, 'night.result.main_event_pot_disabled'],
    'a time chip' => [null, '0', 'night.result.time_chip_disabled'],
]);

it('requires the Main Event pot and the time chip on a site that has them', function (?string $mainEventPot, ?string $timeChip, string $rule) {
    expect(violation(fn () => (new NightRules)->assertValidResult(
        result([1 => 1, 2 => 2, 3 => 3, 4 => 4, 5 => 5, 6 => 6], '840.00', $mainEventPot, $timeChip),
        PercentageTable::standard(),
    ))?->rule)->toBe($rule);
})->with([
    'no Main Event pot' => [null, '0', 'night.result.main_event_pot_required'],
    'no time chip' => ['170.00', null, 'night.result.time_chip_required'],
]);

it('takes a season with no rebuys and no amounts', function () {
    $money = SeasonMoney::of();

    expect($money->hasRebuys())->toBeFalse()->and($money->rebuyValue)->toBeNull();
});

it('has rebuys when some are allowed, or when extra ones are', function (int $allowed, bool $extra, bool $hasRebuys) {
    $money = SeasonMoney::of(rebuyValue: Money::fromDecimal('50.00'), rebuysAllowed: $allowed, allowsExtraRebuys: $extra);

    expect($money->hasRebuys())->toBe($hasRebuys);
})->with([
    'none' => [0, false, false],
    'two allowed' => [2, false, true],
    'only extra ones' => [0, true, true],
]);

it('requires the rebuy value of a season with rebuys', function (int $allowed, bool $extra) {
    $violation = violation(fn () => SeasonMoney::of(buyIn: Money::fromDecimal('50.00'), rebuysAllowed: $allowed, allowsExtraRebuys: $extra));

    expect($violation?->rule)->toBe('season.money.rebuy_value_required')
        ->and($violation?->field)->toBe('rebuy_value');
})->with([
    'two allowed' => [2, false],
    'only extra ones' => [0, true],
]);

it('allows from 0 to 20 rebuys', function (int $allowed, ?string $rule) {
    $violation = violation(fn () => SeasonMoney::of(rebuyValue: Money::fromDecimal('50.00'), rebuysAllowed: $allowed));

    expect($violation?->rule)->toBe($rule);
})->with([
    [0, null],
    [20, null],
    [21, 'season.money.rebuys_allowed'],
    [-1, 'season.money.rebuys_allowed'],
]);

it('keeps the buy-in of the owner of the house at or below the buy-in', function (?string $buyIn, string $houseOwner, ?string $rule) {
    $violation = violation(fn () => SeasonMoney::of(
        buyIn: $buyIn === null ? null : Money::fromDecimal($buyIn),
        houseOwnerBuyIn: Money::fromDecimal($houseOwner),
    ));

    expect($violation?->rule)->toBe($rule);
})->with([
    'half the buy-in' => ['50.00', '25.00', null],
    'free' => ['50.00', '0', null],
    'the same' => ['50.00', '50.00', null],
    'above' => ['50.00', '60.00', 'season.money.house_owner_above_buy_in'],
    'no buy-in' => [null, '25.00', 'season.money.house_owner_without_buy_in'],
]);
