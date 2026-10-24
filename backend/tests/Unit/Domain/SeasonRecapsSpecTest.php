<?php

/*
 * Mirrors the examples in docs/specs/season-recaps.md. Players: Ana = 1, Breno = 2, Carla = 3.
 */

use PTSite\Domain\Recaps\SeasonRecapRules;
use PTSite\Domain\Shared\Money;
use PTSite\Domain\Shared\RuleViolation;
use PTSite\Domain\Standings\ScoreLine;
use PTSite\Domain\Standings\Standings;
use PTSite\Domain\Standings\StandingsDigest;

function recapLine(int $player, string $points, int $position): ScoreLine
{
    return new ScoreLine($player, Money::fromDecimal($points), $position);
}

it('tells how the standings moved on the latest night ("The standings move")', function () {
    $night1 = [recapLine(1, '100.00', 1), recapLine(2, '60.00', 2)];
    $night2 = [recapLine(2, '120.00', 1), recapLine(3, '50.00', 2)];
    $standings = new Standings;

    $lines = (new StandingsDigest)->lines(
        $standings->rank([...$night1, ...$night2]),
        $standings->rank($night1),
        [[1 => 1, 2 => 2], [2 => 1, 3 => 2]],
        [2 => Money::fromDecimal('120.00'), 3 => Money::fromDecimal('50.00')],
    );

    expect(array_map(fn ($l) => [
        $l->row->playerId, $l->row->rank, $l->previousRank, $l->pointsOnLatestNight->toDecimal(),
        $l->gapToLeader->toDecimal(), $l->gapToAbove->toDecimal(), $l->form,
    ], $lines))->toBe([
        [2, 1, 2, '120.00', '0.00', '0.00', [2, 1]],
        [1, 2, 1, '0.00', '80.00', '80.00', [1, null]],
        [3, 3, null, '50.00', '130.00', '50.00', [null, 2]],
    ]);
});

it('keeps only the latest five nights in the form', function () {
    $nights = array_map(fn (int $position) => [1 => $position], [6, 5, 4, 3, 2, 1]);
    $rows = (new Standings)->rank([recapLine(1, '10.00', 1)]);

    expect((new StandingsDigest)->lines($rows, $rows, $nights, [])[0]->form)->toBe([5, 4, 3, 2, 1]);
});

it('gives an empty digest before the first night', function () {
    expect((new StandingsDigest)->lines([], [], [], []))->toBe([]);
});

it('takes one recap per night, of a finished night of the same season ("One per night")', function () {
    $rules = new SeasonRecapRules;

    $rules->assertNightFits(sameSeason: true, finished: true, hasOtherRecap: false);
    expect(fn () => $rules->assertNightFits(true, true, true))->toThrow(RuleViolation::class, 'recap.night_taken')
        ->and(fn () => $rules->assertNightFits(false, true, false))->toThrow(RuleViolation::class, 'recap.night_other_season')
        ->and(fn () => $rules->assertNightFits(true, false, false))->toThrow(RuleViolation::class, 'recap.night_not_finished');
});

it('publishes only on a site with recaps ("Without the feature")', function () {
    $rules = new SeasonRecapRules;

    $rules->assertCanPublish(true);
    expect(fn () => $rules->assertCanPublish(false))->toThrow(RuleViolation::class, 'recap.disabled');
});
