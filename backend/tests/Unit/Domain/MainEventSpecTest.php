<?php

/*
 * The worked examples of docs/specs/main-event.md: the result of a Main Event night.
 */

use PTSite\Domain\Nights\NightRules;
use PTSite\Domain\Nights\NightType;
use PTSite\Domain\Shared\RuleViolation;

function mainEventViolation(callable $fn): ?RuleViolation
{
    try {
        $fn();
    } catch (RuleViolation $e) {
        return $e;
    }

    return null;
}

it('takes the 1st place alone, or as many players as are known', function (array $playerIds) {
    expect(mainEventViolation(fn () => (new NightRules)->assertValidMainEventOrder($playerIds)))->toBeNull();
})->with([
    'the champion alone' => [[7]],
    'nine players' => [[7, 3, 9, 1, 4, 2, 8, 5, 6]],
    'twelve players' => [[7, 3, 9, 1, 4, 2, 8, 5, 6, 10, 11, 12]],
]);

it('requires the 1st place', function () {
    $e = mainEventViolation(fn () => (new NightRules)->assertValidMainEventOrder([]));

    expect($e?->rule)->toBe('night.main_event.first_place_required')
        ->and($e?->field)->toBe('player_ids');
});

it('refuses the same player twice and says where', function () {
    $e = mainEventViolation(fn () => (new NightRules)->assertValidMainEventOrder([7, 3, 9, 3]));

    expect($e?->rule)->toBe('night.main_event.duplicate_player')
        ->and($e?->field)->toBe('player_ids.3')
        ->and($e?->context)->toBe(['position' => 4, 'other_position' => 2]);
});

it('gives a pot only to a regular night and an order only to a Main Event night', function () {
    $rules = new NightRules;

    expect(mainEventViolation(fn () => $rules->assertTakesPoints(NightType::Regular)))->toBeNull()
        ->and(mainEventViolation(fn () => $rules->assertTakesPoints(NightType::MainEvent))?->rule)->toBe('night.result.main_event_night')
        ->and(mainEventViolation(fn () => $rules->assertTakesMainEventOrder(NightType::MainEvent)))->toBeNull()
        ->and(mainEventViolation(fn () => $rules->assertTakesMainEventOrder(NightType::Regular))?->rule)->toBe('night.main_event.regular_night');
});

it('lets a season have one Main Event night', function () {
    $rules = new NightRules;

    expect(mainEventViolation(fn () => $rules->assertNoOtherMainEvent(false)))->toBeNull()
        ->and(mainEventViolation(fn () => $rules->assertNoOtherMainEvent(true))?->rule)->toBe('night.main_event.already_exists');
});
