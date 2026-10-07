<?php

/*
 * Night lifecycle through the API, following docs/specs/seasons-and-nights.md.
 */

use Laravel\Sanctum\Sanctum;
use PTSite\App\Models\AuditLog;
use PTSite\App\Models\Night;
use PTSite\App\Models\Place;
use PTSite\App\Models\Player;
use PTSite\App\Models\Season;
use PTSite\App\Models\User;

function positions(array $players): array
{
    return array_map(fn ($p, $i) => ['position' => $i + 1, 'player_id' => $p->id], $players, array_keys($players));
}

beforeEach(function () {
    $this->season = Season::factory()->create();
    $this->players = Player::factory()->count(7)->create()->all();
});

it('lets a results keeper open a night and enter its results', function () {
    $keeper = User::factory()->resultsKeeper()->create();
    Sanctum::actingAs($keeper);
    $night = Night::factory()->for($this->season)->create();

    $this->postJson("/api/v1/nights/{$night->id}/open")->assertOk()->assertJsonPath('data.status', 'open');

    $this->postJson("/api/v1/nights/{$night->id}/finish", [
        'pot' => '300.00',
        'main_event_pot' => '60.00',
        'time_chip' => '0',
        'positions' => positions(array_slice($this->players, 0, 6)),
    ])
        ->assertOk()
        ->assertJsonPath('data.status', 'finished')
        ->assertJsonPath('data.pot', '300.00')
        ->assertJsonPath('data.main_event_pot', '60.00')
        ->assertJsonPath('data.time_chip', '0.00')
        ->assertJsonPath('data.results.0.points', '114.00')
        ->assertJsonPath('data.results.5.points', '15.00');

    expect(AuditLog::query()->where('action', 'night.finished')->where('user_id', $keeper->id)->exists())->toBeTrue();
});

it('refuses to open a second night in the same season', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    Night::factory()->for($this->season)->open()->create();
    $night = Night::factory()->for($this->season)->create();

    $this->postJson("/api/v1/nights/{$night->id}/open")
        ->assertConflict()
        ->assertJsonPath('rule', 'night.open.another_open')
        ->assertJsonPath('message', 'Já existe um evento aberto nesta temporada. Finalize-o antes de abrir outro.');
});

it('refuses the same player twice and says where', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $night = Night::factory()->for($this->season)->open()->create();
    $order = array_slice($this->players, 0, 6);
    $order[2] = $order[0];

    $this->postJson("/api/v1/nights/{$night->id}/finish", [
        'pot' => '840.00', 'main_event_pot' => '170.00', 'time_chip' => '40.00', 'positions' => positions($order),
    ])
        ->assertUnprocessable()
        ->assertJsonPath('errors', ['positions.3' => ['Este jogador já está na 1ª posição.']]);
});

it('does not let players run nights', function () {
    Sanctum::actingAs(User::factory()->create());
    $night = Night::factory()->for($this->season)->create();

    $this->postJson("/api/v1/nights/{$night->id}/open")->assertForbidden();
    expect($night->fresh()->status)->toBe('scheduled');
});

it('corrects a finished night and records before and after in the audit log', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $night = Night::factory()->for($this->season)->open()->create();
    $order = array_slice($this->players, 0, 6);
    $body = fn ($order, $timeChip = '20.00') => ['pot' => '300.00', 'main_event_pot' => '60.00', 'time_chip' => $timeChip, 'positions' => positions($order)];

    $this->postJson("/api/v1/nights/{$night->id}/finish", $body($order))->assertOk();
    [$order[1], $order[2]] = [$order[2], $order[1]];
    $this->postJson("/api/v1/nights/{$night->id}/finish", $body($order, '35.00'))->assertOk()
        ->assertJsonPath('data.results.1.player.id', $order[1]->id)
        ->assertJsonPath('data.time_chip', '35.00');

    $log = AuditLog::query()->where('action', 'night.corrected')->sole();
    expect($log->before['results'][1]['player_id'])->toBe($order[2]->id)
        ->and($log->after['results'][1]['player_id'])->toBe($order[1]->id)
        ->and($log->before['time_chip'])->toBe('20.00')
        ->and($log->after['time_chip'])->toBe('35.00')
        ->and($log->after['main_event_pot'])->toBe('60.00');
});

it('requires the Main Event pot and the time chip to finish a night', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $night = Night::factory()->for($this->season)->open()->create();

    $this->postJson("/api/v1/nights/{$night->id}/finish", [
        'pot' => '300.00', 'positions' => positions(array_slice($this->players, 0, 6)),
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['main_event_pot', 'time_chip']);
    expect($night->fresh()->status)->toBe('open');
});

it('imports a past night in one step', function () {
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());

    $this->postJson("/api/v1/seasons/{$this->season->id}/nights/import", [
        'starts_at' => '2026-03-14 21:00:00',
        'pot' => '845.00',
        'main_event_pot' => '170.00',
        'time_chip' => '25.00',
        'positions' => positions(array_slice($this->players, 0, 6)),
    ])
        ->assertCreated()
        ->assertJsonPath('data.status', 'finished')
        ->assertJsonPath('data.results.0.points', '321.10')
        ->assertJsonPath('data.main_event_pot', '170.00')
        ->assertJsonPath('data.time_chip', '25.00')
        ->assertJsonPath('data.starts_at', '2026-03-14T21:00:00-03:00');
});

it('schedules a night at the season default place', function () {
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());
    $this->season->update(['default_place_id' => Place::factory()->create()->id]);

    $this->postJson("/api/v1/seasons/{$this->season->id}/nights", ['starts_at' => '2026-10-02 21:00'])
        ->assertCreated()
        ->assertJsonPath('data.status', 'scheduled')
        ->assertJsonPath('data.place.id', $this->season->default_place_id);
});

it('lets a results keeper move a scheduled night, keeping its answers and its place, and records it', function () {
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());
    $place = Place::factory()->create();
    $night = Night::factory()->for($this->season)->create(['starts_at' => '2027-03-12 21:30:00', 'status' => 'scheduled', 'place_id' => $place->id]);
    $night->attendances()->create(['player_id' => $this->players[0]->id, 'answer' => 'all_in', 'answered_at' => now()]);

    // "Remarcar" changes the date and time only: a place sent with it is ignored.
    $this->postJson("/api/v1/nights/{$night->id}/reschedule", ['starts_at' => '2027-03-19 20:00:00', 'place_id' => Place::factory()->create()->id])
        ->assertOk()
        ->assertJsonPath('data.starts_at', '2027-03-19T20:00:00-03:00')
        ->assertJsonPath('data.place.id', $place->id);

    expect($night->attendances()->count())->toBe(1);
    $log = AuditLog::query()->where('action', 'night.rescheduled')->sole();
    expect($log->before['starts_at'])->toBe('2027-03-12T21:30:00-03:00')
        ->and($log->after['starts_at'])->toBe('2027-03-19T20:00:00-03:00');
});

it('refuses to move a night onto a day that already has one, or to move a night already played', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    Night::factory()->for($this->season)->create(['starts_at' => '2027-03-19 21:30:00', 'status' => 'scheduled']);
    $night = Night::factory()->for($this->season)->create(['starts_at' => '2027-03-12 21:30:00', 'status' => 'scheduled']);
    $open = Night::factory()->for($this->season)->open()->create();

    $this->postJson("/api/v1/nights/{$night->id}/reschedule", ['starts_at' => '2027-03-19 20:00:00'])
        ->assertUnprocessable()
        ->assertJsonPath('errors', ['starts_at' => ['Já existe um evento nesta temporada em 19/03/2027.']]);
    $this->postJson("/api/v1/nights/{$open->id}/reschedule", ['starts_at' => '2027-03-26 21:30:00'])
        ->assertConflict()->assertJsonPath('rule', 'night.reschedule.not_scheduled');
});

it('cancels a scheduled night by archiving it, frees its date, and records it', function () {
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());
    $night = Night::factory()->for($this->season)->create(['starts_at' => '2027-03-12 21:30:00', 'status' => 'scheduled']);

    $this->postJson("/api/v1/nights/{$night->id}/cancel")->assertOk()->assertJsonPath('data.archived', true);

    expect(AuditLog::query()->where('action', 'night.cancelled')->sole()->after['archived_at'])->not->toBeNull();
    $this->getJson("/api/v1/seasons/{$this->season->id}/nights")->assertJsonCount(0, 'data');
    // The date is free again.
    $other = Night::factory()->for($this->season)->create(['starts_at' => '2027-03-05 21:30:00', 'status' => 'scheduled']);
    $this->postJson("/api/v1/nights/{$other->id}/reschedule", ['starts_at' => '2027-03-12 21:30:00'])->assertOk();
});

it('refuses to cancel an open or finished night', function (string $status) {
    Sanctum::actingAs(User::factory()->admin()->create());
    $night = Night::factory()->for($this->season)->create(['status' => $status]);

    $this->postJson("/api/v1/nights/{$night->id}/cancel")->assertConflict()->assertJsonPath('rule', 'night.cancel.not_scheduled');
})->with(['open', 'finished']);

it('lets only results keepers and admins move, edit or cancel nights', function () {
    Sanctum::actingAs(User::factory()->create());
    $night = Night::factory()->for($this->season)->create(['status' => 'scheduled']);

    $this->postJson("/api/v1/nights/{$night->id}/reschedule", ['starts_at' => '2027-03-19 20:00:00'])->assertForbidden();
    $this->patchJson("/api/v1/nights/{$night->id}", ['description' => 'Noite de pizza'])->assertForbidden();
    $this->postJson("/api/v1/nights/{$night->id}/cancel")->assertForbidden();
});

it('lets a results keeper edit the place and description of a scheduled night, and records it', function () {
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());
    $night = Night::factory()->for($this->season)->create(['starts_at' => '2027-03-12 21:30:00', 'status' => 'scheduled']);
    $place = Place::factory()->create();

    $this->patchJson("/api/v1/nights/{$night->id}", ['place_id' => $place->id, 'description' => 'Noite de pizza'])
        ->assertOk()
        ->assertJsonPath('data.place.id', $place->id)
        ->assertJsonPath('data.description', 'Noite de pizza')
        ->assertJsonPath('data.starts_at', '2027-03-12T21:30:00-03:00');

    $log = AuditLog::query()->where('action', 'night.updated')->sole();
    expect($log->before['place_id'])->toBeNull()
        ->and($log->after['place_id'])->toBe($place->id)
        ->and($log->after['description'])->toBe('Noite de pizza');
});

it('changes only the fields sent, and clears the place when asked', function () {
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());
    $place = Place::factory()->create();
    $night = Night::factory()->for($this->season)->create(['status' => 'scheduled', 'place_id' => $place->id]);

    $this->patchJson("/api/v1/nights/{$night->id}", ['description' => 'Noite de pizza'])
        ->assertOk()
        ->assertJsonPath('data.place.id', $place->id);
    $this->patchJson("/api/v1/nights/{$night->id}", ['place_id' => null])
        ->assertOk()
        ->assertJsonPath('data.place', null)
        ->assertJsonPath('data.description', 'Noite de pizza');
    // The date is not one of the fields: it is ignored here.
    $this->patchJson("/api/v1/nights/{$night->id}", ['starts_at' => '2027-03-19 20:00:00']);
    expect($night->fresh()->starts_at->toDateTimeString())->toBe($night->starts_at->toDateTimeString());
});

it('lets only an admin edit an open or finished night, and leaves its result alone', function (string $status) {
    $night = Night::factory()->for($this->season)->create(['status' => $status, 'pot' => '300.00']);
    $night->results()->create(['position' => 1, 'player_id' => $this->players[0]->id, 'points' => '114.00']);
    $place = Place::factory()->create();

    Sanctum::actingAs(User::factory()->resultsKeeper()->create());
    $this->patchJson("/api/v1/nights/{$night->id}", ['place_id' => $place->id])->assertForbidden();

    Sanctum::actingAs(User::factory()->admin()->create());
    $this->patchJson("/api/v1/nights/{$night->id}", ['place_id' => $place->id])
        ->assertOk()
        ->assertJsonPath('data.place.id', $place->id)
        ->assertJsonPath('data.status', $status)
        ->assertJsonPath('data.pot', '300.00')
        ->assertJsonPath('data.results.0.points', '114.00');
})->with(['open', 'finished']);

it('refuses to edit a cancelled night', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $night = Night::factory()->for($this->season)->create(['status' => 'scheduled']);
    $this->postJson("/api/v1/nights/{$night->id}/cancel")->assertOk();

    $this->patchJson("/api/v1/nights/{$night->id}", ['description' => 'Noite de pizza'])->assertForbidden();
});

it('finishes a night with the pot alone on a site with no Main Event pot and no time chip', function () {
    config(['ptsite.features' => ['mainEventPot' => false, 'timeChip' => false]]);
    Sanctum::actingAs(User::factory()->admin()->create());
    $night = Night::factory()->for($this->season)->open()->create();
    $positions = positions(array_slice($this->players, 0, 6));

    $this->postJson("/api/v1/nights/{$night->id}/finish", ['pot' => '300.00', 'positions' => $positions])
        ->assertOk()
        ->assertJsonPath('data.status', 'finished')
        ->assertJsonPath('data.main_event_pot', null)
        ->assertJsonPath('data.time_chip', null);

    // An amount that is sent anyway is not kept.
    $this->postJson("/api/v1/nights/{$night->id}/finish", ['pot' => '300.00', 'main_event_pot' => '60.00', 'time_chip' => '20.00', 'positions' => $positions])
        ->assertOk()
        ->assertJsonPath('data.main_event_pot', null)
        ->assertJsonPath('data.time_chip', null);
});

it('turns off the Main Event pot and the time chip one by one', function () {
    config(['ptsite.features' => ['timeChip' => false]]);
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());
    $body = ['starts_at' => '2026-03-14 21:00:00', 'pot' => '845.00', 'positions' => positions(array_slice($this->players, 0, 6))];

    $this->postJson("/api/v1/seasons/{$this->season->id}/nights/import", $body)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['main_event_pot'])
        ->assertJsonMissingValidationErrors(['time_chip']);

    $this->postJson("/api/v1/seasons/{$this->season->id}/nights/import", [...$body, 'main_event_pot' => '170.00'])
        ->assertCreated()
        ->assertJsonPath('data.main_event_pot', '170.00')
        ->assertJsonPath('data.time_chip', null);
});
