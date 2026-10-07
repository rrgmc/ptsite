# Backend layers

> Describes the current code. The reasons are in [0002](../decisions/0002-business-logic-layering.md).

## Folders

```
backend/
  src/Domain/             PTSite\Domain: league rules, plain PHP, no Laravel
    Shared/                 Money (whole cents), RuleViolation
    Scoring/                PercentageTable, PointsCalculator
    Nights/                 NightStatus, NightResult, NightRules (lifecycle and result rules), SchedulePattern,
                            NightSuggester (next three regular weekdays)
    Calendar/               Easter, HolidayRule, HolidayException, HolidayCalendar, HolidayPreset, HolidayPresets and
                            SaoPauloHolidays (the starting table), SeasonPlanner (a season's dates around holidays)
    Attendance/             AttendanceAnswer, AttendanceRules
    Standings/              Standings, RankingSimulator, ScoreLine, StandingRow, SimulatedRow
    Statistics/             Statistics (top ten lists and the leaders' running totals), PlayerStatistics (one player's),
                            Ranking, NightRecord
  app/Actions/            one class per change; check policy, call domain, save, audit
    Nights/                 OpenNight, FinishNight, ScheduleNight, ScheduleNights (the planner's batch),
                            ImportNight, RescheduleNight, CancelNight, UpdateNight (place and description),
                            WriteNightResult, NightSnapshot, SavePartialResult, KnownPlayers
    Attendance/             AnswerAttendance
    Holidays/               SaveHoliday, SaveHolidayException, DeleteHolidayException
    Players/                QuickAddPlayer, SavePlayer, NicknameCheck
    Seasons/                SaveSeason
    Places/                 SavePlace
    Auth/                   LogIn (with the upgrade of old MD5 hashes), ChangeOwnPassword, RequestPasswordReset (sends the
                            link by email), ResetPassword
    Import/                 VerifyLeagueData (the `ptsite:verify` check)
  app/Queries/            reads that need the domain: SeasonStandings, SimulateRanking, SuggestNightDates,
                            PlanSeasonNights, SeasonCalendar, HolidayCalendarForYear, LeagueStatistics,
                            StatisticsOfPlayer, FinishedNights, PendingPasswordReset
  app/Mail/               messages the site sends, sent inside the request: PasswordResetMail
  resources/views/mail/   their text, as an HTML view and a plain text view
  app/Http/Controllers/Api  thin: validate (Form Request), call one action or query, return a resource
  app/Http/Requests/      input shape; Save* for create, Update* for partial updates
  app/Http/Resources/     JSON shape
  app/Models/             Eloquent: columns, relationships, casts, scopes only
  app/Policies/           who may do what (player, results keeper, admin)
  app/Support/            AuditLogger, HolidayTable (holiday rows → domain calendar), PlayerPhotoMaker, DatabaseCreator
  lang/pt_BR/             validation, auth and rule messages
  tests/Unit/Domain/      domain tests, no database; mirror the examples in docs/specs
  tests/Feature/          API tests through HTTP
  tests/Arch/             architecture tests
```

## Dependency rules

| Layer | May use | Must not use |
|---|---|---|
| `src/Domain` | plain PHP, other domain classes | anything from `Illuminate`, `PTSite\App`, `Laravel` |
| `app/Actions` | domain classes, models, policies, `AuditLogger` | `App\Http`, `Request` |
| `app/Queries` | domain classes, models | `App\Http` |
| `app/Http/Controllers` | actions, queries, requests, resources, models for simple reads | `DB` facade, `PTSite\Domain` |
| `app/Models` | Eloquent | domain classes, actions, HTTP; save hooks with side effects |

The namespace rules in this table are enforced by `tests/Arch/LayersTest.php`, so a violation fails CI.
Rules that a namespace check cannot express, such as "controllers never call `save()`", are covered by review
and `AGENTS.md`.

Models do not use domain enums either: `nights.status` is a plain string in the model, and actions convert it
with `NightStatus::from()`.

## Business rule errors

Domain classes throw `PTSite\Domain\Shared\RuleViolation` with a rule code (such as `night.open.another_open`),
the input field it concerns, and context values. `bootstrap/app.php` renders it as JSON, taking the message
from `lang/pt_BR/rules.php`. The domain has no user-facing text.

## Stored versus calculated

- **Stored:** each night's result lines (`night_results`: position, player, points). Points are calculated once,
  by `WriteNightResult`, when a night is finished, corrected or imported.
- **Stored for a while:** an open night's partial result (`night_partial_results` and
  `night_partial_result_positions`: the amounts and positions the players recorded so far, with no points).
  `SavePartialResult` replaces it on every save, and `FinishNight` deletes it.
- **Calculated on every request:** season standings (`SeasonStandings`, a sum of the stored points) and the
  simulator. Standings of one season take a few milliseconds. The statistics (`LeagueStatistics`, and
  `StatisticsOfPlayer` for one player) are calculated the same way.
- **Calculated, not stored: holiday dates and season plans.** The `holidays` table stores rules (a day and month,
  or days after Easter) and `holiday_exceptions` the changes for single years; the dates are worked out when
  asked. A plan is only stored once the admin schedules it, as ordinary nights. The season calendar's "Sem evento" days
  come from the same planner walk, on every request.
- **Why not store standings:** a correction changes them at once with nothing else to update. Stored totals
  would need updating on every correction, and a missed update gives wrong standings.
- **If it gets slow** (for example statistics across all seasons, not built yet): add a short cache and clear it
  in `FinishNight` and `ImportNight`, the only actions that change results. No new table needed.

## Worked example: "Finalizar" (finish a night)

`FinishNight` (`app/Actions/Nights/FinishNight.php`):

```php
public function __invoke(User $user, Night $night, string $pot, string $mainEventPot, string $timeChip, array $playerByPosition): Night
{
    Gate::forUser($user)->authorize('finish', $night);
    $wasFinished = $night->status === NightStatus::Finished->value;
    $this->rules->assertCanFinish(NightStatus::from($night->status));

    return DB::transaction(function () use (...) {
        $before = NightSnapshot::of($night);
        ($this->writeResult)($night, $pot, $mainEventPot, $timeChip, $playerByPosition); // rules + points + save
        $this->audit->record($user, $wasFinished ? 'night.corrected' : 'night.finished', $night, $before, NightSnapshot::of($night));

        return $night;
    });
}
```

The controller only connects HTTP to the action:

```php
public function finish(FinishNightRequest $request, Night $night, FinishNight $finish): NightResource
{
    return $this->resource($finish(
        $request->user(), $night,
        $request->validated('pot'), $request->validated('main_event_pot'), $request->validated('time_chip'),
        $request->playerByPosition(),
    ));
}
```

The domain test mirrors the example in [points-and-standings.md](../specs/points-and-standings.md):

```php
it('pays each scoring position its share of a R$ 845 pot, adding up to the pot', function () {
    expect(points('845.00'))->toBe([1 => '321.10', 2 => '194.35', 3 => '126.75', 4 => '92.95', 5 => '67.60', 6 => '42.25']);
});
```

## Adding a feature (the pattern)

1. Write or update the rule in `docs/specs/`, with an example.
2. Put the rule in `src/Domain` and add a unit test for the example.
3. Add a migration and model fields if data changes.
4. Add an action in `app/Actions` that authorizes, calls the domain, saves and audits.
5. Add a Form Request, a controller method, a route and a resource.
6. Add a feature test in `tests/Feature`.
7. Regenerate the API spec and types (see [api.md](api.md)), then build the screen.

## When to go stricter

If an area grows complex, its actions can switch from Eloquent to repository interfaces and plain domain
objects, one area at a time. See the alternatives in [0002](../decisions/0002-business-logic-layering.md).
