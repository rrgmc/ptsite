<?php

/*
 * Mirrors the examples in docs/specs/points-and-standings.md.
 * Players in the examples: Ana = 1, Breno = 2. Other ids are filler players.
 */

use PTSite\Domain\Scoring\PercentageTable;
use PTSite\Domain\Scoring\PointsCalculator;
use PTSite\Domain\Shared\Money;
use PTSite\Domain\Shared\RuleViolation;
use PTSite\Domain\Standings\RankingSimulator;
use PTSite\Domain\Standings\ScoreLine;
use PTSite\Domain\Standings\Standings;

const ANA = 1;
const BRENO = 2;

function points(string $pot): array
{
    return array_map(
        fn (Money $m) => $m->toDecimal(),
        (new PointsCalculator)->calculate(Money::fromDecimal($pot), PercentageTable::standard()),
    );
}

function line(int $player, string $points, int $position): ScoreLine
{
    return new ScoreLine($player, Money::fromDecimal($points), $position);
}

it('pays each scoring position its share of a R$ 300 pot', function () {
    expect(points('300.00'))->toBe([1 => '114.00', 2 => '69.00', 3 => '45.00', 4 => '33.00', 5 => '24.00', 6 => '15.00']);
});

it('pays each scoring position its share of a R$ 845 pot, adding up to the pot', function () {
    $points = points('845.00');
    expect($points)->toBe([1 => '321.10', 2 => '194.35', 3 => '126.75', 4 => '92.95', 5 => '67.60', 6 => '42.25']);

    $total = array_reduce($points, fn (Money $sum, string $p) => $sum->plus(Money::fromDecimal($p)), Money::zero());
    expect($total->toDecimal())->toBe('845.00');
});

it('refuses a percentage table that does not add up to 100', function () {
    PercentageTable::of([1 => 40, 2 => 23, 3 => 15, 4 => 11, 5 => 8, 6 => 5]);
})->throws(RuleViolation::class, 'percentage_table.total');

it('reports the wrong total of a percentage table', function () {
    try {
        PercentageTable::of([1 => 40, 2 => 23, 3 => 15, 4 => 11, 5 => 8, 6 => 5]);
    } catch (RuleViolation $e) {
        expect($e->context['total'])->toBe(102);
    }
});

it('ranks players by total points after two nights', function () {
    $rows = (new Standings)->rank([
        line(ANA, '114.00', 1), line(BRENO, '69.00', 2),
        line(ANA, '45.00', 3), line(BRENO, '114.00', 1),
    ]);

    expect(array_map(fn ($r) => [$r->rank, $r->playerId, $r->points->toDecimal()], $rows))
        ->toBe([[1, BRENO, '183.00'], [2, ANA, '159.00']]);
});

it('changes the standings when a night is corrected', function () {
    $rows = (new Standings)->rank([
        line(ANA, '114.00', 1), line(BRENO, '69.00', 2),
        line(ANA, '114.00', 1), line(BRENO, '45.00', 3),
    ]);

    expect(array_map(fn ($r) => [$r->playerId, $r->points->toDecimal()], $rows))
        ->toBe([[ANA, '228.00'], [BRENO, '114.00']]);
});

it('gives tied players the same rank, with no tie-breaker', function () {
    $rows = (new Standings)->rank([line(3, '50.00', 1), line(ANA, '40.00', 2), line(BRENO, '40.00', 2), line(4, '10.00', 6)]);

    expect(array_map(fn ($r) => $r->rank, $rows))->toBe([1, 2, 2, 4]);
});

it('keeps the first ten of the standings', function () {
    $standings = new Standings;
    $rows = $standings->rank(array_map(fn (int $player) => line($player, (string) (200 - $player).'.00', 1), range(1, 12)));

    $top = $standings->top($rows);

    expect(array_map(fn ($r) => $r->playerId, $top->rows))->toBe(range(1, 10))
        ->and($top->tiedNotShown)->toBe(0);
});

it('says how many players tied with the tenth were left out', function () {
    $standings = new Standings;
    // Nine players ahead, then three with the same total: one of them is tenth, two do not fit.
    $lines = array_map(fn (int $player) => line($player, (string) (200 - $player).'.00', 1), range(1, 9));
    $rows = $standings->rank([...$lines, line(10, '50.00', 2), line(11, '50.00', 2), line(12, '50.00', 2), line(13, '10.00', 6)]);

    $top = $standings->top($rows);

    expect(count($top->rows))->toBe(10)
        ->and($top->rows[9]->rank)->toBe(10)
        ->and($top->tiedNotShown)->toBe(2);
});

it('keeps every row when fewer than ten players scored', function () {
    $standings = new Standings;
    $top = $standings->top($standings->rank([line(ANA, '114.00', 1), line(BRENO, '69.00', 2)]));

    expect(count($top->rows))->toBe(2)->and($top->tiedNotShown)->toBe(0)
        ->and($standings->top([])->rows)->toBe([]);
});

it('simulates a night without saving and shows who moves up', function () {
    $current = [
        line(ANA, '114.00', 1), line(BRENO, '69.00', 2),
        line(ANA, '114.00', 1), line(BRENO, '45.00', 3),
    ];
    // Breno wins a R$ 400 pot; Ana does not score. Players 11–15 fill the other positions.
    $rows = (new RankingSimulator)->simulate(
        $current,
        Money::fromDecimal('400.00'),
        [1 => BRENO, 2 => 11, 3 => 12, 4 => 13, 5 => 14, 6 => 15],
        PercentageTable::standard(),
    );

    $breno = $rows[0];
    expect($breno->playerId)->toBe(BRENO)
        ->and($breno->addedPoints->toDecimal())->toBe('152.00')
        ->and($breno->simulatedPoints->toDecimal())->toBe('266.00')
        ->and($breno->movement())->toBe(1)
        ->and($rows[1]->playerId)->toBe(ANA)
        ->and($rows[1]->simulatedPoints->toDecimal())->toBe('228.00')
        ->and($rows[1]->movement())->toBe(-1);
});
