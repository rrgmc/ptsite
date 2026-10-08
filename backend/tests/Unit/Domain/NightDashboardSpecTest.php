<?php

/*
 * Mirrors the examples in docs/specs/night-dashboard.md.
 */

use PTSite\Domain\Features\Features;
use PTSite\Domain\Nights\MoneyTotal;
use PTSite\Domain\Nights\NightDashboardRules;
use PTSite\Domain\Nights\NightEntry;
use PTSite\Domain\Nights\NightMoney;
use PTSite\Domain\Nights\NightPrices;
use PTSite\Domain\Nights\NightStatus;
use PTSite\Domain\Nights\NightType;
use PTSite\Domain\Seasons\SeasonMoney;
use PTSite\Domain\Shared\Money;
use PTSite\Domain\Shared\RuleViolation;

/** The season of the examples; $settings replaces some of its money settings. */
function nightMoney(array $features = ['houseOwnerBuyIn' => true], array $settings = []): NightMoney
{
    $season = SeasonMoney::of(...[
        'buyIn' => Money::fromDecimal('50.00'),
        'rebuyValue' => Money::fromDecimal('50.00'),
        'timeChipValue' => Money::fromDecimal('5.00'),
        'rebuysAllowed' => 2,
        'rebuyChargesTimeChip' => true,
        'allowsExtraRebuys' => true,
        'houseOwnerBuyIn' => Money::fromDecimal('25.00'),
        ...$settings,
    ]);

    return new NightMoney(NightPrices::of($season, new Features($features)));
}

/** The night of the examples, at Élio's house. */
function theNight(): array
{
    return [
        'ana' => new NightEntry(1, buyInPaid: true, rebuysPaid: [true]),
        'breno' => new NightEntry(2, buyInPaid: true, rebuysPaid: [true, true, false]),
        'carla' => new NightEntry(3, timeChip: true, timeChipPaid: true),
        'dudu' => new NightEntry(4),
        'elio' => new NightEntry(5, isHouseOwner: true, buyInPaid: true),
    ];
}

/** @return array{string, string, string} owed, paid and pending */
function amounts(MoneyTotal $total): array
{
    return [$total->owed->toDecimal(), $total->paid->toDecimal(), $total->pending()->toDecimal()];
}

function dashboardViolation(callable $fn): ?string
{
    try {
        $fn();
    } catch (RuleViolation $e) {
        return $e->rule;
    }

    return null;
}

it('adds the buy-ins and every rebuy up as the pot, and keeps the time chip apart', function () {
    $money = nightMoney();
    $pot = $money->pot(theNight());
    $timeChip = $money->timeChip(theNight());

    expect(amounts($pot))->toBe(['425.00', '275.00', '150.00'])
        ->and(amounts($timeChip))->toBe(['25.00', '20.00', '5.00'])
        ->and(amounts($pot->plus($timeChip)))->toBe(['450.00', '295.00', '155.00']);
});

it('charges the owner of the house the smaller buy-in, and the others the buy-in', function () {
    $money = nightMoney();

    expect($money->buyInOf(theNight()['elio'])->toDecimal())->toBe('25.00')
        ->and($money->buyInOf(theNight()['dudu'])->toDecimal())->toBe('50.00');
});

it('works out what one participant owes and has pending', function () {
    $money = nightMoney();
    $breno = $money->potOf(theNight()['breno'])->plus($money->timeChipOf(theNight()['breno']));

    expect(amounts($breno))->toBe(['215.00', '160.00', '55.00']);
});

it('charges the owner of the house the buy-in on a site without the house owner\'s buy-in', function () {
    $money = nightMoney(features: []);

    expect($money->buyInOf(theNight()['elio'])->toDecimal())->toBe('50.00')
        ->and($money->pot(theNight())->owed->toDecimal())->toBe('450.00');
});

it('has no time chip on a site without the time chip', function () {
    $money = nightMoney(['houseOwnerBuyIn' => true, 'timeChip' => false]);

    expect(amounts($money->timeChip(theNight())))->toBe(['0.00', '0.00', '0.00'])
        ->and($money->pot(theNight())->owed->toDecimal())->toBe('425.00');
});

it('charges the time chip only of the late players when a rebuy does not pay it', function () {
    $money = nightMoney(settings: ['rebuyChargesTimeChip' => false]);

    expect(amounts($money->timeChip(theNight())))->toBe(['5.00', '5.00', '0.00']);
});

it('counts a price the season does not have as zero', function () {
    $money = new NightMoney(NightPrices::of(SeasonMoney::of(allowsExtraRebuys: true, rebuyValue: Money::zero())));

    expect(amounts($money->pot(theNight())))->toBe(['0.00', '0.00', '0.00'])
        ->and(amounts($money->timeChip(theNight())))->toBe(['0.00', '0.00', '0.00']);
});

it('suggests the season\'s share of the pot as the Main Event pot, rounded to a whole unit', function (?int $percent, ?string $suggested) {
    $money = nightMoney(settings: ['mainEventPotPercent' => $percent]);

    expect($money->suggestedMainEventPot(Money::fromDecimal('425.00'))?->toDecimal())->toBe($suggested);
})->with([
    '20%' => [20, '85.00'],
    '15%, from 63.75' => [15, '64.00'],
    'no share' => [null, null],
]);

it('suggests no Main Event pot on a site without it', function () {
    $money = nightMoney(['mainEventPot' => false], ['mainEventPotPercent' => 20]);

    expect($money->suggestedMainEventPot(Money::fromDecimal('425.00')))->toBeNull();
});

it('takes a share of the pot from 0 to 100', function (int $percent, ?string $rule) {
    expect(dashboardViolation(fn () => SeasonMoney::of(mainEventPotPercent: $percent)))->toBe($rule);
})->with([
    [0, null],
    [100, null],
    [101, 'season.money.main_event_pot_percent'],
    [-1, 'season.money.main_event_pot_percent'],
]);

it('follows the season\'s rebuys', function (int $allowed, bool $extra, int $has, ?string $rule) {
    $money = nightMoney(settings: ['rebuysAllowed' => $allowed, 'allowsExtraRebuys' => $extra]);

    expect(dashboardViolation(fn () => $money->assertCanRebuy($has)))->toBe($rule);
})->with([
    'a season with no rebuys' => [0, false, 0, 'night.money.no_rebuys'],
    'below the limit' => [2, false, 1, null],
    'at the limit' => [2, false, 2, 'night.money.rebuy_limit'],
    'past the limit, when the season allows it' => [2, true, 2, null],
    'only past the limit' => [0, true, 0, null],
    'nobody has more than 50' => [2, true, 50, 'night.money.rebuy_limit'],
]);

it('keeps a participant with a mark or a rebuy on the night', function (?NightEntry $entry, ?string $rule) {
    expect(dashboardViolation(fn () => (new NightDashboardRules)->assertCanLeave($entry)))->toBe($rule);
})->with([
    'no record' => [null, null],
    'no marks' => [new NightEntry(3), null],
    'the house owner with no marks' => [new NightEntry(5, isHouseOwner: true), null],
    'paid the buy-in' => [new NightEntry(4, buyInPaid: true), 'night.money.has_payments'],
    'owes a time chip' => [new NightEntry(4, timeChip: true), 'night.money.has_payments'],
    'an unpaid rebuy' => [new NightEntry(4, rebuysPaid: [false]), 'night.money.has_payments'],
]);

it('gives a dashboard to a regular night that is open or finished', function (NightStatus $status, NightType $type, bool $archived, ?string $rule) {
    expect(dashboardViolation(fn () => (new NightDashboardRules)->assertHasDashboard($status, $type, $archived)))->toBe($rule);
})->with([
    'open' => [NightStatus::Open, NightType::Regular, false, null],
    'finished' => [NightStatus::Finished, NightType::Regular, false, null],
    'scheduled' => [NightStatus::Scheduled, NightType::Regular, false, 'night.dashboard.not_open'],
    'cancelled' => [NightStatus::Scheduled, NightType::Regular, true, 'night.dashboard.not_open'],
    'a Main Event night' => [NightStatus::Open, NightType::MainEvent, false, 'night.dashboard.main_event_night'],
]);

it('takes positions and the Main Event pot only while the night is open', function () {
    $rules = new NightDashboardRules;

    expect(dashboardViolation(fn () => $rules->assertTakesPartialResult(NightStatus::Open)))->toBeNull()
        ->and(dashboardViolation(fn () => $rules->assertTakesPartialResult(NightStatus::Finished)))->toBe('night.dashboard.finished');
});
