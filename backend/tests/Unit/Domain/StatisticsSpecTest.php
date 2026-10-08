<?php

/*
 * Mirrors the examples in docs/specs/statistics.md.
 * Players: Ana = 1, Breno = 2, Carla = 3, Dudu = 9. Places: Casa do Ana = 1, Bar do Zé = 2. Seasons: A = 1, B = 2.
 */

use PTSite\Domain\Shared\Money;
use PTSite\Domain\Standings\ScoreLine;
use PTSite\Domain\Statistics\MainEventStatistics;
use PTSite\Domain\Statistics\NightRecord;
use PTSite\Domain\Statistics\PlayerStatistics;
use PTSite\Domain\Statistics\Statistics;
use PTSite\Domain\Statistics\TopList;

const S_ANA = 1;
const S_BRENO = 2;
const S_CARLA = 3;
const S_DUDU = 9;

/** @param list<int> $order player ids, first place first */
function statsNight(int $id, int $season, string $pot, ?int $place, array $order): NightRecord
{
    $shares = $pot === '400.00' ? ['152.00', '92.00', '60.00'] : ['114.00', '69.00', '45.00'];

    // Every night sets aside a tenth of its pot for the Main Event, and R$ 20,00 of time chips.
    $mainEventPot = Money::cents(intdiv(Money::fromDecimal($pot)->cents, 10));

    return new NightRecord($id, $season, Money::fromDecimal($pot), $mainEventPot, Money::fromDecimal('20.00'), $place, array_map(
        fn (int $player, int $i) => new ScoreLine($player, Money::fromDecimal($shares[$i]), $i + 1),
        $order,
        array_keys($order),
    ));
}

/** @return list<NightRecord> */
function seasonA(): array
{
    return [
        statsNight(1, 1, '300.00', 1, [S_ANA, S_BRENO, S_CARLA]),
        statsNight(2, 1, '400.00', 2, [S_BRENO, S_CARLA, S_ANA]),
    ];
}

/** @return list<NightRecord> */
function everySeason(?int $placeOfNight3 = 1): array
{
    return [...seasonA(), statsNight(3, 2, '300.00', $placeOfNight3, [S_ANA, S_CARLA])];
}

/** @return list<array{int, int, int}> rank, id, value */
function rows(TopList $list): array
{
    return array_map(fn ($r) => [$r->rank, $r->id, $r->value], $list->rows);
}

it('adds up total points over every season', function () {
    expect(rows((new Statistics)->summarise(everySeason())->totalPoints))
        ->toBe([[1, S_ANA, 28800], [2, S_BRENO, 22100], [3, S_CARLA, 20600]]);
});

it('adds up total points of one season only', function () {
    expect(rows((new Statistics)->summarise(seasonA())->totalPoints))
        ->toBe([[1, S_BRENO, 22100], [2, S_ANA, 17400], [3, S_CARLA, 13700]]);
});

it('counts the nights scored, and tied players share a position', function () {
    expect(rows((new Statistics)->summarise(everySeason())->nightsScored))
        ->toBe([[1, S_ANA, 3], [1, S_CARLA, 3], [3, S_BRENO, 2]]);
});

it('counts how often each player finished in each position', function () {
    $positions = (new Statistics)->summarise(everySeason())->positions;

    expect(array_keys($positions))->toBe([1, 2, 3])
        ->and(rows($positions[1]))->toBe([[1, S_ANA, 2], [2, S_BRENO, 1]])
        ->and(rows($positions[2]))->toBe([[1, S_CARLA, 2], [2, S_BRENO, 1]])
        ->and(rows($positions[3]))->toBe([[1, S_ANA, 1], [1, S_CARLA, 1]]);
});

it('lists the biggest pots, and counts the nights and adds up their three amounts', function () {
    $summary = (new Statistics)->summarise(everySeason());

    expect(rows($summary->biggestPots))->toBe([[1, 2, 40000], [2, 1, 30000], [2, 3, 30000]])
        ->and($summary->nightsCount)->toBe(3)
        ->and($summary->potTotal->toDecimal())->toBe('1000.00')
        ->and($summary->mainEventPotTotal->toDecimal())->toBe('100.00')
        ->and($summary->timeChipTotal->toDecimal())->toBe('60.00');
});

it('counts the nights at each place', function () {
    expect(rows((new Statistics)->summarise(everySeason())->places))->toBe([[1, 1, 2], [2, 2, 1]]);
});

it('does not count a night with no place', function () {
    expect(rows((new Statistics)->summarise(everySeason(placeOfNight3: null))->places))->toBe([[1, 1, 1], [1, 2, 1]]);
});

it('follows the leaders night by night in a season', function () {
    $progress = (new Statistics)->summarise(seasonA())->progress;

    expect($progress->steps)->toBe([1, 2])
        ->and(array_map(fn ($totals) => array_map(fn (Money $m) => $m->toDecimal(), $totals), $progress->totals))
        ->toBe([S_BRENO => ['69.00', '221.00'], S_ANA => ['114.00', '174.00'], S_CARLA => ['45.00', '137.00']]);
});

it('follows the leaders season by season over every season', function () {
    $progress = (new Statistics)->summarise(everySeason(), stepPerSeason: true)->progress;

    expect($progress->steps)->toBe([1, 2])
        ->and(array_map(fn ($totals) => array_map(fn (Money $m) => $m->toDecimal(), $totals), $progress->totals))
        ->toBe([S_ANA => ['174.00', '288.00'], S_BRENO => ['221.00', '221.00'], S_CARLA => ['137.00', '206.00']]);
});

it('cuts a list at ten and says how many tied lines it left out', function () {
    $nights = array_map(fn (int $n) => statsNight($n, 1, '300.00', 1, [$n]), range(1, 12));
    $summary = (new Statistics)->summarise($nights);
    $wins = $summary->positions[1];

    expect($wins->rows)->toHaveCount(10)
        ->and(array_unique(array_map(fn ($r) => $r->rank, $wins->rows)))->toBe([1])
        ->and($wins->tiedNotShown)->toBe(2)
        ->and($summary->winsNotShown)->toBe(2);
});

it('sums up one player over every season', function () {
    $ana = (new PlayerStatistics)->summarise(S_ANA, everySeason(), stepPerSeason: true);

    expect($ana->rank)->toBe(1)
        ->and($ana->points->toDecimal())->toBe('288.00')
        ->and($ana->nightsScored)->toBe(3)
        ->and($ana->wins)->toBe(2)
        ->and($ana->positions)->toBe([1 => 2, 2 => 0, 3 => 1]);
});

it('sums up one player in one season', function () {
    $ana = (new PlayerStatistics)->summarise(S_ANA, seasonA());

    expect($ana->rank)->toBe(2)
        ->and($ana->points->toDecimal())->toBe('174.00')
        ->and($ana->nightsScored)->toBe(2)
        ->and($ana->wins)->toBe(1);
});

it('lists a player\'s standing in each season they scored in, newest first', function () {
    $seasons = fn (int $player) => array_map(
        fn ($s) => [$s->seasonId, $s->rank, $s->points->toDecimal(), $s->nightsScored, $s->wins],
        (new PlayerStatistics)->summarise($player, everySeason(), stepPerSeason: true)->seasons,
    );

    expect($seasons(S_ANA))->toBe([[2, 1, '114.00', 1, 1], [1, 2, '174.00', 2, 1]])
        ->and($seasons(S_BRENO))->toBe([[1, 1, '221.00', 2, 1]]);
});

it('lists the nights on which a player scored, newest first', function () {
    $results = (new PlayerStatistics)->summarise(S_ANA, everySeason(), stepPerSeason: true)->results;

    expect(array_map(fn ($r) => [$r->nightId, $r->seasonId, $r->position, $r->points->toDecimal()], $results))
        ->toBe([[3, 2, 1, '114.00'], [2, 1, 3, '60.00'], [1, 1, 1, '114.00']]);
});

it('follows one player night by night in a season, and season by season over every season', function () {
    $totals = fn (int $player, array $nights, bool $perSeason) => array_map(
        fn (Money $m) => $m->toDecimal(),
        (new PlayerStatistics)->summarise($player, $nights, $perSeason)->progress,
    );

    expect((new PlayerStatistics)->summarise(S_ANA, seasonA())->progressSteps)->toBe([1, 2])
        ->and($totals(S_ANA, seasonA(), false))->toBe(['114.00', '174.00'])
        ->and($totals(S_ANA, everySeason(), true))->toBe(['174.00', '288.00'])
        // Breno did not play in season B: his line stays flat.
        ->and($totals(S_BRENO, everySeason(), true))->toBe(['221.00', '221.00']);
});

it('shows zeros and no rank for a player who never scored', function () {
    $dudu = (new PlayerStatistics)->summarise(9, everySeason(), stepPerSeason: true);

    expect($dudu->rank)->toBeNull()
        ->and($dudu->points->toDecimal())->toBe('0.00')
        ->and($dudu->nightsScored)->toBe(0)
        ->and($dudu->wins)->toBe(0)
        ->and($dudu->positions)->toBe([1 => 0, 2 => 0, 3 => 0])
        ->and($dudu->seasons)->toBe([])
        ->and($dudu->results)->toBe([])
        ->and(array_map(fn (Money $m) => $m->toDecimal(), $dudu->progress))->toBe(['0.00', '0.00']);
});

it('has empty lists when no night is finished', function () {
    $summary = (new Statistics)->summarise([]);

    expect($summary->nightsCount)->toBe(0)
        ->and($summary->totalPoints->rows)->toBe([])
        ->and($summary->positions)->toBe([])
        ->and($summary->progress->steps)->toBe([])
        ->and($summary->winsNotShown)->toBe(0);
});

it('counts the titles, the podiums and the appearances of the Main Events', function () {
    // Season A's Main Event: Ana, Breno, Carla, Dudu. Season B's: Breno, Ana, Dudu.
    $summary = (new MainEventStatistics)->summarise([[S_ANA, S_BRENO, S_CARLA, S_DUDU], [S_BRENO, S_ANA, S_DUDU]]);

    expect($summary->count)->toBe(2)
        ->and(rows($summary->titles))->toBe([[1, S_ANA, 1], [1, S_BRENO, 1]])
        ->and(rows($summary->podiums))->toBe([[1, S_ANA, 2], [1, S_BRENO, 2], [3, S_CARLA, 1], [3, S_DUDU, 1]])
        ->and(rows($summary->appearances))->toBe([[1, S_ANA, 2], [1, S_BRENO, 2], [1, S_DUDU, 2], [4, S_CARLA, 1]]);
});

it('counts a Main Event of which only the champion is known', function () {
    $summary = (new MainEventStatistics)->summarise([[S_CARLA]]);

    expect(rows($summary->titles))->toBe([[1, S_CARLA, 1]])
        ->and(rows($summary->podiums))->toBe([[1, S_CARLA, 1]])
        ->and(rows($summary->appearances))->toBe([[1, S_CARLA, 1]]);
});

it('has empty Main Event lists when no Main Event is finished', function () {
    $summary = (new MainEventStatistics)->summarise([]);

    expect($summary->count)->toBe(0)->and($summary->titles->rows)->toBe([])->and($summary->appearances->rows)->toBe([]);
});
