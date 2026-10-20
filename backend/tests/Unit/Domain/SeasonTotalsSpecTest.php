<?php

/*
 * Mirrors the examples in docs/specs/season-totals.md: "Temporada antiga" (season 1, 3 rounds) and "Temporada nova"
 * (season 2, one night). Players: Ana = 1, Breno = 2, Carla = 3, Davi = 4, Elisa = 5, Flora = 6, Gabi = 7.
 */

use PTSite\Domain\Scoring\PercentageTable;
use PTSite\Domain\Seasons\SeasonTotalsRules;
use PTSite\Domain\Shared\Money;
use PTSite\Domain\Shared\RuleViolation;
use PTSite\Domain\Standings\ScoreLine;
use PTSite\Domain\Standings\Standings;
use PTSite\Domain\Standings\TotalsLine;
use PTSite\Domain\Statistics\NightRecord;
use PTSite\Domain\Statistics\PlayerStatistics;
use PTSite\Domain\Statistics\RankedRow;
use PTSite\Domain\Statistics\Statistics;

/** @param  list<int>  $counts  1st place first */
function totalsLine(int $player, string $points, array $counts): TotalsLine
{
    return new TotalsLine($player, Money::fromDecimal($points), array_combine(range(1, count($counts)), $counts));
}

/** @return list<TotalsLine> */
function oldSeason(string $davi = '90.00', int $brenoWins = 1): array
{
    return [
        totalsLine(1, '250.50', [2, 0, 0, 1, 0, 0]),
        totalsLine(2, '180.00', [$brenoWins, 1, 0, 0, 1, 0]),
        totalsLine(3, '120.00', [0, 1, 1, 0, 0, 1]),
        totalsLine(4, $davi, [0, 1, 1, 0, 0, 0]),
        totalsLine(5, '60.00', [0, 0, 1, 1, 1, 0]),
        totalsLine(6, '30.00', [0, 0, 0, 1, 0, 1]),
        totalsLine(7, '12.50', [0, 0, 0, 0, 1, 1]),
    ];
}

/** @return list<NightRecord> the old season, then the new season's night: R$ 300, won by Ana */
function bothSeasons(): array
{
    $order = [1, 2, 3, 4, 5, 6];
    $points = ['114.00', '69.00', '45.00', '33.00', '24.00', '15.00'];

    return [
        NightRecord::seasonTotals(1, 3, oldSeason()),
        new NightRecord(10, 2, Money::fromDecimal('300.00'), Money::zero(), Money::zero(), 1,
            array_map(fn (int $player, string $p, int $i) => new ScoreLine($player, Money::fromDecimal($p), $i + 1), $order, $points, array_keys($order))),
    ];
}

it('ranks a season known only by its final standings by its total points', function () {
    $rows = (new Standings)->rank(oldSeason());

    expect($rows[0])->rank->toBe(1)->playerId->toBe(1)->nightsScored->toBe(3)->wins->toBe(2)
        ->and($rows[0]->points->toDecimal())->toBe('250.50')
        ->and($rows[0]->positions)->toBe([1 => 2, 2 => 0, 3 => 0, 4 => 1, 5 => 0, 6 => 0])
        ->and($rows[6])->rank->toBe(7)->playerId->toBe(7)->nightsScored->toBe(2)
        ->and($rows[6]->points->toDecimal())->toBe('12.50');
});

it('gives players with the same total points of a season known only by its final standings the same rank', function () {
    $rows = (new Standings)->rank(oldSeason(davi: '120.00'));

    expect(array_map(fn ($row) => [$row->playerId, $row->rank], $rows))->toBe([[1, 1], [2, 2], [3, 3], [4, 3], [5, 5], [6, 6], [7, 7]]);
});

it('accepts final lines', function () {
    (new SeasonTotalsRules)->assertValidTotals(oldSeason(), PercentageTable::standard());
})->throwsNoExceptions();

it('accepts final lines whose counts in a position do not add up to the rounds', function () {
    (new SeasonTotalsRules)->assertValidTotals(oldSeason(brenoWins: 2), PercentageTable::standard());
})->throwsNoExceptions();

it('refuses a player listed twice in the final lines', function () {
    (new SeasonTotalsRules)->assertValidTotals([...oldSeason(), totalsLine(1, '1.00', [0, 0, 0, 0, 0, 0])], PercentageTable::standard());
})->throws(RuleViolation::class, 'season.totals.duplicate_player');

it('refuses a final line without a count for every scoring position', function () {
    (new SeasonTotalsRules)->assertValidTotals([totalsLine(1, '1.00', [1, 0, 0])], PercentageTable::standard());
})->throws(RuleViolation::class, 'season.totals.positions');

it('refuses a negative count in a final line', function () {
    (new SeasonTotalsRules)->assertValidTotals([totalsLine(1, '1.00', [1, 0, 0, 0, 0, -1])], PercentageTable::standard());
})->throws(RuleViolation::class, 'season.totals.positions');

it('accepts no final line, which clears them', function () {
    (new SeasonTotalsRules)->assertValidTotals([], PercentageTable::standard());
})->throwsNoExceptions();

it('refuses final lines for a season with a regular night', function () {
    (new SeasonTotalsRules)->assertCanSaveTotals(hasRegularNights: true, archived: false);
})->throws(RuleViolation::class, 'season.totals.has_nights');

it('refuses final lines for an archived season', function () {
    (new SeasonTotalsRules)->assertCanSaveTotals(hasRegularNights: false, archived: true);
})->throws(RuleViolation::class, 'season.not_open');

it('refuses a regular night in a season known only by its final standings', function () {
    (new SeasonTotalsRules)->assertTakesRegularNights(true);
})->throws(RuleViolation::class, 'season.totals_only');

it('refuses to change the percentages of a season known only by its final standings', function () {
    (new SeasonTotalsRules)->assertCanChangeTable(totalsOnly: true, tableChanged: true);
})->throws(RuleViolation::class, 'season.totals.locked');

it('counts a season known only by its final standings in the statistics of every season, but not in the pots', function () {
    $summary = (new Statistics)->summarise(bothSeasons(), stepPerSeason: true);

    expect($summary->nightsCount)->toBe(4)
        ->and($summary->potTotal->toDecimal())->toBe('300.00')
        ->and($summary->totalPoints->rows[0])->id->toBe(1)->value->toBe(36450)
        ->and($summary->nightsScored->rows[0])->id->toBe(1)->value->toBe(4)
        ->and(array_map(fn (RankedRow $row) => [$row->id, $row->value], $summary->positions[1]->rows))->toBe([[1, 3], [2, 1]])
        ->and(array_map(fn (RankedRow $row) => $row->id, $summary->biggestPots->rows))->toBe([10])
        ->and($summary->progress->steps)->toBe([1, 2])
        ->and(array_map(fn (Money $m) => $m->toDecimal(), $summary->progress->totals[1]))->toBe(['250.50', '364.50']);
});

it('leaves a season known only by its final standings out of a progress night by night', function () {
    $summary = (new Statistics)->summarise([NightRecord::seasonTotals(1, 3, oldSeason())]);

    expect($summary->nightsCount)->toBe(3)
        ->and($summary->progress->steps)->toBe([])
        ->and($summary->biggestPots->rows)->toBe([])
        ->and($summary->positionTable[0])->playerId->toBe(1)->counts->toBe([1 => 2, 2 => 0, 3 => 0, 4 => 1, 5 => 0, 6 => 0]);
});

it('lists a season known only by its final standings on a player\'s page, with no result of a night', function () {
    $summary = (new PlayerStatistics)->summarise(1, bothSeasons(), stepPerSeason: true);

    expect($summary->seasons[1])->seasonId->toBe(1)->rank->toBe(1)->nightsScored->toBe(3)->wins->toBe(2)
        ->and($summary->seasons[1]->points->toDecimal())->toBe('250.50')
        ->and(array_map(fn ($result) => $result->nightId, $summary->results))->toBe([10])
        ->and($summary->points->toDecimal())->toBe('364.50')
        ->and($summary->wins)->toBe(3)
        ->and($summary->positions)->toBe([1 => 3, 2 => 0, 3 => 0, 4 => 1, 5 => 0, 6 => 0]);
});
