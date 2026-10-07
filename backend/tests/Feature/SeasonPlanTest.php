<?php

/*
 * The season planner through the API (docs/specs/season-planner.md): the 2027 examples end to end, the holiday
 * table and its yearly exceptions, and scheduling the chosen dates.
 */

use Laravel\Sanctum\Sanctum;
use PTSite\App\Models\AuditLog;
use PTSite\App\Models\Holiday;
use PTSite\App\Models\Night;
use PTSite\App\Models\Season;
use PTSite\App\Models\User;

beforeEach(function () {
    $this->season = Season::factory()->create([
        'starts_on' => '2027-01-01', 'schedule_weekday' => 5, 'schedule_time' => '21:30', 'schedule_every_weeks' => 2,
    ]);
    $this->planUrl = "/api/v1/seasons/{$this->season->id}/night-plan";
});

function planned($response): array
{
    return array_map(
        fn ($n) => substr($n['starts_at'], 8, 2).'/'.substr($n['starts_at'], 5, 2).' '
            .($n['included'] ? 'ok' : ($n['taken'] ? 'taken' : $n['skip_reason']['kind'].': '.$n['skip_reason']['holiday'])),
        $response->json('data'),
    );
}

it('plans the 2027 Fridays, skipping Carnival, Sexta-feira Santa and the Corpus Christi emenda', function () {
    Sanctum::actingAs(User::factory()->admin()->create());

    $response = $this->getJson("{$this->planUrl}?from=2027-01-25&to=2027-06-10")->assertOk();

    expect(planned($response))->toBe([
        '29/01 ok', '12/02 ok', '26/02 ok', '12/03 ok', '26/03 holiday: Sexta-feira Santa', '02/04 ok', '16/04 ok',
        '30/04 ok', '14/05 ok', '28/05 bridge: Corpus Christi', '04/06 ok',
    ]);
    $response->assertJsonPath('data.0.starts_at', '2027-01-29T21:30:00-03:00');
});

it('skips the Friday before Carnival', function () {
    Sanctum::actingAs(User::factory()->admin()->create());

    expect(planned($this->getJson("{$this->planUrl}?from=2027-02-01&to=2027-02-12")))->toBe(['05/02 carnival: Carnaval', '12/02 ok']);
});

it('follows the yearly exceptions: a cancelled holiday is planned, an extra one is skipped', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $corpus = Holiday::query()->where('name', 'Corpus Christi')->sole();

    $cancel = $this->postJson('/api/v1/holiday-exceptions', ['year' => 2027, 'holiday_id' => $corpus->id])->assertCreated();
    $this->postJson('/api/v1/holiday-exceptions', ['year' => 2027, 'date' => '2027-06-11', 'name' => 'Jogo do Brasil'])->assertCreated();

    expect(planned($this->getJson("{$this->planUrl}?from=2027-05-14&to=2027-06-20")))
        ->toBe(['14/05 ok', '28/05 ok', '11/06 holiday: Jogo do Brasil', '18/06 ok']);

    $this->deleteJson('/api/v1/holiday-exceptions/'.$cancel->json('data.id'))->assertNoContent();
    expect(planned($this->getJson("{$this->planUrl}?from=2027-05-14&to=2027-05-30")))
        ->toBe(['14/05 ok', '28/05 bridge: Corpus Christi']);

    expect(AuditLog::query()->where('action', 'like', 'holiday_exception.%')->pluck('action')->all())
        ->toBe(['holiday_exception.created', 'holiday_exception.created', 'holiday_exception.deleted']);
});

it('refuses to cancel the same holiday twice in a year', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $natal = Holiday::query()->where('name', 'Natal')->sole();

    $this->postJson('/api/v1/holiday-exceptions', ['year' => 2027, 'holiday_id' => $natal->id])->assertCreated();
    $this->postJson('/api/v1/holiday-exceptions', ['year' => 2027, 'holiday_id' => $natal->id])
        ->assertUnprocessable()->assertJsonPath('rule', 'holiday_exception.exists');
});

it('lists a year\'s holidays, with the cancelled ones marked and the extras', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $natal = Holiday::query()->where('name', 'Natal')->sole();
    $this->postJson('/api/v1/holiday-exceptions', ['year' => 2027, 'holiday_id' => $natal->id]);
    $this->postJson('/api/v1/holiday-exceptions', ['year' => 2027, 'date' => '2027-12-23', 'name' => 'Confraternização da liga']);

    $this->getJson('/api/v1/holiday-calendar/2027')->assertOk()
        ->assertJsonCount(18, 'data')
        ->assertJsonPath('data.4', ['date' => '2027-03-26', 'name' => 'Sexta-feira Santa', 'scope' => 'national', 'holiday_id' => Holiday::query()->where('name', 'Sexta-feira Santa')->value('id'), 'cancelled' => false, 'exception_id' => null])
        ->assertJsonPath('data.14.name', 'Confraternização da liga')
        ->assertJsonPath('data.15.name', 'Véspera de Natal')
        ->assertJsonPath('data.16.name', 'Natal')
        ->assertJsonPath('data.16.cancelled', true)
        ->assertJsonPath('data.17.name', 'Véspera de Ano Novo');
});

it('shows archived holidays only to admins who ask for them, and lets them restore one', function () {
    $count = Holiday::query()->count();
    $holiday = Holiday::query()->firstOrFail();
    $holiday->forceFill(['archived_at' => now()])->save();

    Sanctum::actingAs(User::factory()->create());
    $this->getJson('/api/v1/holidays?archived=1')->assertJsonCount($count - 1, 'data');

    Sanctum::actingAs(User::factory()->admin()->create());
    $this->getJson('/api/v1/holidays')->assertJsonCount($count - 1, 'data');
    $this->getJson('/api/v1/holidays?archived=1')->assertJsonCount($count, 'data');

    $this->patchJson("/api/v1/holidays/{$holiday->id}", ['archived' => false])->assertOk()->assertJsonPath('data.archived', false);
    $this->getJson('/api/v1/holidays')->assertJsonCount($count, 'data');
});

it('lets admins add, change and archive holidays, and checks them', function () {
    Sanctum::actingAs(User::factory()->admin()->create());

    $created = $this->postJson('/api/v1/holidays', ['name' => 'Aniversário da liga', 'scope' => 'city', 'month' => 3, 'day' => 14])
        ->assertCreated()->assertJsonPath('data.easter_offset', null);
    $id = $created->json('data.id');

    $this->patchJson("/api/v1/holidays/{$id}", ['easter_offset' => 1])->assertOk()
        ->assertJsonPath('data.month', null)->assertJsonPath('data.easter_offset', 1);
    $this->patchJson("/api/v1/holidays/{$id}", ['archived' => true])->assertOk()->assertJsonPath('data.archived', true);

    $this->postJson('/api/v1/holidays', ['name' => 'X', 'scope' => 'city', 'month' => 4, 'day' => 31])
        ->assertUnprocessable()->assertJsonPath('rule', 'holiday.date');
    $this->postJson('/api/v1/holidays', ['name' => 'X', 'scope' => 'city'])
        ->assertUnprocessable()->assertJsonPath('rule', 'holiday.kind');
    $this->postJson('/api/v1/holidays', ['name' => 'X', 'scope' => 'city', 'month' => 1, 'day' => 2, 'easter_offset' => 3])
        ->assertUnprocessable()->assertJsonPath('rule', 'holiday.kind');

    expect(AuditLog::query()->where('action', 'like', 'holiday.%')->pluck('action')->all())
        ->toBe(['holiday.created', 'holiday.updated', 'holiday.updated']);
});

it('lets only admins plan and change holidays', function (User $user) {
    Sanctum::actingAs($user);
    $natal = Holiday::query()->where('name', 'Natal')->sole();

    $this->getJson('/api/v1/holidays')->assertOk();
    $this->getJson('/api/v1/holiday-calendar/2027')->assertOk();
    $this->getJson("{$this->planUrl}?from=2027-01-01&to=2027-02-01")->assertForbidden();
    $this->postJson("/api/v1/seasons/{$this->season->id}/nights/batch", ['starts_at' => ['2027-01-08 21:30']])->assertForbidden();
    $this->postJson('/api/v1/holidays', ['name' => 'X', 'scope' => 'city', 'month' => 1, 'day' => 2])->assertForbidden();
    $this->patchJson("/api/v1/holidays/{$natal->id}", ['name' => 'X'])->assertForbidden();
    $this->postJson('/api/v1/holiday-exceptions', ['year' => 2027, 'holiday_id' => $natal->id])->assertForbidden();
})->with([
    'results keeper' => fn () => User::factory()->resultsKeeper()->create(),
    'player' => fn () => User::factory()->create(),
]);

it('checks the plan range', function () {
    Sanctum::actingAs(User::factory()->admin()->create());

    $this->getJson("{$this->planUrl}?from=2027-02-01&to=2027-01-01")->assertUnprocessable()->assertJsonPath('rule', 'plan.range');
    $this->getJson("{$this->planUrl}?from=2027-01-01&to=2029-01-01")->assertUnprocessable()->assertJsonPath('rule', 'plan.too_long');
    $this->getJson($this->planUrl)->assertUnprocessable()->assertJsonValidationErrors(['from', 'to']);
});

it('schedules the chosen dates, audits each night, and marks them taken in the plan', function () {
    Sanctum::actingAs(User::factory()->admin()->create());

    $this->postJson("/api/v1/seasons/{$this->season->id}/nights/batch", ['starts_at' => ['2027-01-08 21:30', '2027-01-22 21:30']])
        ->assertCreated()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.status', 'scheduled');

    expect(AuditLog::query()->where('action', 'night.scheduled')->count())->toBe(2);
    expect(planned($this->getJson("{$this->planUrl}?from=2027-01-04&to=2027-02-01")))->toBe(['08/01 taken', '22/01 taken']);
});

it('schedules all or none: a date that already has a night refuses the whole batch', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    Night::factory()->for($this->season)->create(['starts_at' => '2027-01-22 21:30:00', 'status' => 'scheduled']);

    $this->postJson("/api/v1/seasons/{$this->season->id}/nights/batch", ['starts_at' => ['2027-01-08 21:30', '2027-01-22 20:00']])
        ->assertUnprocessable()
        ->assertJsonPath('rule', 'plan.date_taken')
        ->assertJsonPath('errors', ['starts_at.1' => ['Já existe um evento nesta temporada em 22/01/2027.']]);

    expect($this->season->nights()->count())->toBe(1);
});

it('keeps the cadence setting on the season', function () {
    Sanctum::actingAs(User::factory()->admin()->create());

    $this->patchJson("/api/v1/seasons/{$this->season->id}", ['schedule_every_weeks' => 1])->assertOk()
        ->assertJsonPath('data.schedule', ['weekday' => 5, 'time' => '21:30', 'every_weeks' => 1]);
    $this->patchJson("/api/v1/seasons/{$this->season->id}", ['schedule_every_weeks' => 5])->assertUnprocessable();
});

it('carries on from the season\'s nights and links the ones already scheduled', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    Night::factory()->for($this->season)->create(['starts_at' => '2027-02-12 21:30:00', 'status' => 'finished']);
    $thursday = Night::factory()->for($this->season)->create(['starts_at' => '2027-04-15 20:00:00', 'status' => 'scheduled']);

    $response = $this->getJson("{$this->planUrl}?from=2027-03-01&to=2027-05-10")->assertOk();

    expect(planned($response))->toBe(['12/03 ok', '26/03 holiday: Sexta-feira Santa', '02/04 ok', '15/04 taken', '30/04 ok']);
    $response->assertJsonPath('data.3.night_id', $thursday->id)
        ->assertJsonPath('data.3.starts_at', '2027-04-15T20:00:00-03:00')
        ->assertJsonPath('data.0.night_id', null);
});

it('keeps the season\'s rounds, 26 unless changed, and counts its nights', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    Night::factory()->for($this->season)->create(['starts_at' => '2027-01-08 21:30:00', 'status' => 'scheduled']);
    Night::factory()->for($this->season)->create(['starts_at' => '2027-01-22 21:30:00', 'status' => 'scheduled', 'archived_at' => now()]);

    $this->getJson("/api/v1/seasons/{$this->season->id}")->assertJsonPath('data.rounds', 26)->assertJsonPath('data.nights_planned', 1);
    $this->patchJson("/api/v1/seasons/{$this->season->id}", ['rounds' => 20])->assertOk()->assertJsonPath('data.rounds', 20);
    $this->patchJson("/api/v1/seasons/{$this->season->id}", ['rounds' => 0])->assertUnprocessable();
});

it('stops the plan at the rounds left when asked', function () {
    Sanctum::actingAs(User::factory()->admin()->create());

    expect(planned($this->getJson("{$this->planUrl}?from=2027-01-04&to=2028-06-30&count=3")->assertOk()))
        ->toBe(['08/01 ok', '22/01 ok', '05/02 carnival: Carnaval', '12/02 ok']);
    $this->getJson("{$this->planUrl}?from=2027-01-04&to=2027-12-31&count=0")->assertUnprocessable();
});
