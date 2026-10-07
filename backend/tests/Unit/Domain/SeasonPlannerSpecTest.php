<?php

/*
 * Mirrors the examples in docs/specs/season-planner.md. They use 2027 (Easter on 28/03), the São Paulo holiday
 * table, and a regular night on Friday at 21:30.
 */

use PTSite\Domain\Calendar\Easter;
use PTSite\Domain\Calendar\HolidayCalendar;
use PTSite\Domain\Calendar\HolidayException;
use PTSite\Domain\Calendar\HolidayRule;
use PTSite\Domain\Calendar\HolidayScope;
use PTSite\Domain\Calendar\SaoPauloHolidays;
use PTSite\Domain\Calendar\SeasonPlanner;
use PTSite\Domain\Nights\SchedulePattern;
use PTSite\Domain\Shared\RuleViolation;

/** @param list<HolidayException> $exceptions */
function calendar2027(array $exceptions = []): HolidayCalendar
{
    return HolidayCalendar::build(SaoPauloHolidays::rules(), $exceptions, [2026, 2027]);
}

/** Each planned date as "d/m" plus its state: "ok", "taken", or the skip kind and holiday. */
function plan(string $from, string $to, int $everyWeeks = 2, array $exceptions = [], array $taken = [], ?int $count = null): array
{
    $rows = (new SeasonPlanner)->plan(
        SchedulePattern::of(5, '21:30', $everyWeeks),
        new DateTimeImmutable($from),
        new DateTimeImmutable($to),
        calendar2027($exceptions),
        array_map(fn ($d) => new DateTimeImmutable($d), $taken),
        $count,
    );

    return array_map(fn ($n) => $n->startsAt->format('d/m').' '.match (true) {
        $n->included => 'ok',
        $n->taken => 'taken',
        default => $n->skipKind->value.': '.$n->holiday,
    }, $rows);
}

it('finds Easter and Carnival', function (int $year, string $easter, string $carnival) {
    expect(Easter::sunday($year)->format('d/m'))->toBe($easter)
        ->and(Easter::carnivalTuesday($year)->format('d/m'))->toBe($carnival);
})->with([
    [2024, '31/03', '13/02'],
    [2025, '20/04', '04/03'],
    [2026, '05/04', '17/02'],
    [2027, '28/03', '09/02'],
    [2028, '16/04', '29/02'],
    [2029, '01/04', '13/02'],
    [2030, '21/04', '05/03'],
]);

it('works out the 2027 holidays from the table', function () {
    $holidays = array_map(
        fn ($h) => $h->date->format('d/m').' '.$h->name,
        array_values(array_filter(calendar2027()->all(), fn ($h) => $h->date->format('Y') === '2027')),
    );

    expect($holidays)->toBe([
        '01/01 Confraternização Universal',
        '25/01 Aniversário de São Paulo',
        '08/02 Carnaval (segunda-feira)',
        '09/02 Carnaval',
        '26/03 Sexta-feira Santa',
        '21/04 Tiradentes',
        '01/05 Dia do Trabalho',
        '27/05 Corpus Christi',
        '09/07 Revolução Constitucionalista',
        '07/09 Independência do Brasil',
        '12/10 Nossa Senhora Aparecida',
        '02/11 Finados',
        '15/11 Proclamação da República',
        '20/11 Consciência Negra',
        '24/12 Véspera de Natal',
        '25/12 Natal',
        '31/12 Véspera de Ano Novo',
    ]);
});

it('plans every other Friday, skipping Carnival, Sexta-feira Santa and the Corpus Christi emenda', function () {
    expect(plan('2027-01-04', '2027-06-30'))->toBe([
        '08/01 ok',
        '22/01 ok',
        '05/02 carnival: Carnaval',
        '12/02 ok',
        '26/02 ok',
        '12/03 ok',
        '26/03 holiday: Sexta-feira Santa',
        '02/04 ok',
        '16/04 ok',
        '30/04 ok',
        '14/05 ok',
        '28/05 bridge: Corpus Christi',
        '04/06 ok',
        '18/06 ok',
    ]);
});

it('plans 28/05 when Corpus Christi is cancelled for 2027', function () {
    expect(plan('2027-05-14', '2027-06-11', exceptions: [HolidayException::cancel(2027, 'corpus-christi')]))
        ->toBe(['14/05 ok', '28/05 ok', '11/06 ok']);
});

it('skips an extra holiday added for one year', function () {
    $extra = HolidayException::extra(2027, new DateTimeImmutable('2027-06-11'), 'Jogo do Brasil');

    expect(plan('2027-05-14', '2027-06-30', exceptions: [HolidayException::cancel(2027, 'corpus-christi'), $extra]))
        ->toBe(['14/05 ok', '28/05 ok', '11/06 holiday: Jogo do Brasil', '18/06 ok']);
});

it('stops skipping the Carnival weekend when Carnival is cancelled for the year', function () {
    expect(plan('2027-02-05', '2027-02-05', exceptions: [HolidayException::cancel(2027, 'carnaval-terca')]))
        ->toBe(['05/02 ok']);
});

it('moves a skipped night one week later, and the cadence carries on from there', function () {
    expect(plan('2027-03-12', '2027-04-30'))->toBe([
        '12/03 ok',
        '26/03 holiday: Sexta-feira Santa',
        '02/04 ok',
        '16/04 ok',
        '30/04 ok',
    ]);
});

it('plans every week when the season plays weekly', function () {
    expect(plan('2027-03-12', '2027-04-02', everyWeeks: 1))
        ->toBe(['12/03 ok', '19/03 ok', '26/03 holiday: Sexta-feira Santa', '02/04 ok']);
});

it('shows dates that already have a night as taken, and carries on from them', function () {
    expect(plan('2027-01-04', '2027-02-01', taken: ['2027-01-08 21:30']))
        ->toBe(['08/01 taken', '22/01 ok']);
});

it('checks the plan range and the cadence', function (Closure $call, string $rule) {
    expect($call)->toThrow(RuleViolation::class, $rule);
})->with([
    'end before start' => [fn () => plan('2027-02-01', '2027-01-01'), 'plan.range'],
    'longer than 18 months' => [fn () => plan('2027-01-01', '2028-12-31'), 'plan.too_long'],
    'every 5 weeks' => [fn () => SchedulePattern::of(5, '21:30', 5), 'schedule.every_weeks'],
]);

it('checks holidays in the table and the yearly exceptions', function (Closure $call, string $rule) {
    expect($call)->toThrow(RuleViolation::class, $rule);
})->with([
    '31/04' => [fn () => HolidayRule::fixed('x', 'X', HolidayScope::National, 4, 31), 'holiday.date'],
    '200 days after Easter' => [fn () => HolidayRule::easter('x', 'X', HolidayScope::National, 200), 'holiday.easter_offset'],
    'years backwards' => [fn () => HolidayRule::fixed('x', 'X', HolidayScope::National, 1, 2, 2025, 2024), 'holiday.years'],
    'extra in another year' => [fn () => HolidayException::extra(2027, new DateTimeImmutable('2028-01-02'), 'X'), 'holiday_exception.year'],
]);

it('limits a holiday to its years', function () {
    $rule = HolidayRule::fixed('consciencia-negra', 'Consciência Negra', HolidayScope::National, 11, 20, firstYear: 2024);

    expect($rule->dateIn(2023))->toBeNull()
        ->and($rule->dateIn(2024)?->format('d/m/Y'))->toBe('20/11/2024');
});

it('carries on the rhythm from the season\'s last night before the plan', function () {
    // The last night was 12/02; every other Friday gives 26/02 and then 12/03, the first on or after 01/03.
    expect(plan('2027-03-01', '2027-04-10', taken: ['2027-02-12 21:30']))
        ->toBe(['12/03 ok', '26/03 holiday: Sexta-feira Santa', '02/04 ok']);
});

it('counts a week that already has a night, on any day, as that cycle\'s night', function () {
    // A Thursday night on 20/05: no Friday that week, and the cadence carries on from it.
    expect(plan('2027-05-03', '2027-06-20', taken: ['2027-05-20 20:00']))
        ->toBe(['07/05 ok', '20/05 taken', '04/06 ok', '18/06 ok']);
});

it('moves the rhythm to an existing night off the usual weeks', function () {
    // A Friday night on 14/05, one week after 07/05: the next is two weeks after it, 28/05, the Corpus Christi
    // emenda, so it moves to 04/06.
    expect(plan('2027-05-03', '2027-06-20', taken: ['2027-05-14 21:30']))
        ->toBe(['07/05 ok', '14/05 taken', '28/05 bridge: Corpus Christi', '04/06 ok', '18/06 ok']);
});

it('keeps the real day and time of an existing night', function () {
    $rows = (new SeasonPlanner)->plan(
        SchedulePattern::of(5, '21:30', 2),
        new DateTimeImmutable('2027-05-03'),
        new DateTimeImmutable('2027-05-31'),
        calendar2027(),
        [new DateTimeImmutable('2027-05-20 20:00')],
    );

    expect($rows[1]->startsAt->format('d/m H:i'))->toBe('20/05 20:00')->and($rows[1]->taken)->toBeTrue();
});

it('stops at the night that completes the rounds left', function () {
    expect(plan('2027-01-04', '2027-12-31', count: 3))->toBe(['08/01 ok', '22/01 ok', '05/02 carnival: Carnaval', '12/02 ok']);
});

const PLANNED_26TH = '21/01 ok'; // 21/01/2028
const SKIPPED_IN_26_ROUNDS = [
    '05/02 carnival: Carnaval',
    '26/03 holiday: Sexta-feira Santa',
    '28/05 bridge: Corpus Christi',
    '31/12 holiday: Véspera de Ano Novo',
];

it('plans a whole empty season of 26 rounds around the holidays', function () {
    $rows = plan('2027-01-04', '2028-06-30', count: 26);
    $planned = array_values(array_filter($rows, fn ($r) => str_ends_with($r, ' ok')));

    expect($planned)->toHaveCount(26)
        ->and(end($planned))->toBe(PLANNED_26TH)
        ->and(array_values(array_filter($rows, fn ($r) => ! str_ends_with($r, ' ok'))))->toBe(SKIPPED_IN_26_ROUNDS);
});

it('keeps the nights already scheduled up to the last planned one', function () {
    expect(plan('2027-01-04', '2027-12-31', taken: ['2027-01-22 21:30', '2027-12-17 21:30'], count: 2))
        ->toBe(['08/01 ok', '22/01 taken', '05/02 carnival: Carnaval', '12/02 ok']);
});

it('skips Christmas Eve and New Year\'s Eve Fridays', function () {
    // 24/12/2027 and 31/12/2027 are Fridays; weekly, both move on and the next is 07/01/2028.
    $calendar = HolidayCalendar::build(SaoPauloHolidays::rules(), [], [2027, 2028]);
    $rows = (new SeasonPlanner)->plan(SchedulePattern::of(5, '21:30', 1), new DateTimeImmutable('2027-12-13'), new DateTimeImmutable('2028-01-10'), $calendar);

    expect(array_map(fn ($n) => $n->startsAt->format('d/m').' '.($n->included ? 'ok' : $n->holiday), $rows))
        ->toBe(['17/12 ok', '24/12 Véspera de Natal', '31/12 Véspera de Ano Novo', '07/01 ok']);
});
