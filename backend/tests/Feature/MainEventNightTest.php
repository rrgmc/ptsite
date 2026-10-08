<?php

/*
 * The Main Event night through the API, following docs/specs/main-event.md: a night of its own type, finished
 * with the order of its players and no points.
 */

use Laravel\Sanctum\Sanctum;
use PTSite\App\Models\AuditLog;
use PTSite\App\Models\Night;
use PTSite\App\Models\Place;
use PTSite\App\Models\Player;
use PTSite\App\Models\Season;
use PTSite\App\Models\User;

beforeEach(function () {
    config(['ptsite.features' => ['mainEvent' => true]]);
    $this->season = Season::factory()->create();
    $this->players = Player::factory()->count(12)->create()->all();
    $this->ids = fn (int $count) => array_map(fn ($p) => $p->id, array_slice($this->players, 0, $count));
    $this->mainEvent = fn (array $attributes = []) => Night::factory()->for($this->season)
        ->create(['type' => 'main_event', 'is_extra' => true, ...$attributes]);
    $this->finishRound = function (Season $season, array $attributes = []): Night {
        $night = Night::factory()->for($season)->open()->create($attributes);
        $this->postJson("/api/v1/nights/{$night->id}/finish", [
            'pot' => '300.00', 'main_event_pot' => '60.00', 'time_chip' => '0',
            'positions' => array_map(fn ($id, $i) => ['position' => $i + 1, 'player_id' => $id], ($this->ids)(6), range(0, 5)),
        ])->assertOk();

        return $night;
    };
});

it('schedules a Main Event night, which is always extra', function () {
    Sanctum::actingAs(User::factory()->admin()->create());

    $this->postJson("/api/v1/seasons/{$this->season->id}/nights", ['starts_at' => '2027-12-11 13:00', 'type' => 'main_event'])
        ->assertCreated()
        ->assertJsonPath('data.type', 'main_event')
        ->assertJsonPath('data.is_extra', true)
        ->assertJsonPath('data.status', 'scheduled')
        ->assertJsonPath('data.main_event_positions', []);

    expect(AuditLog::query()->where('action', 'night.scheduled')->sole()->after['type'])->toBe('main_event');
});

it('refuses a second Main Event night in a season, unless the first was cancelled', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $first = ($this->mainEvent)();
    $body = ['starts_at' => '2027-12-11 13:00', 'type' => 'main_event'];

    $this->postJson("/api/v1/seasons/{$this->season->id}/nights", $body)
        ->assertUnprocessable()
        ->assertJsonPath('errors', ['type' => ['Esta temporada já tem um Main Event.']]);

    $this->postJson("/api/v1/nights/{$first->id}/cancel")->assertOk();
    $this->postJson("/api/v1/seasons/{$this->season->id}/nights", $body)->assertCreated();
    // Another season has a Main Event of its own.
    $this->postJson('/api/v1/seasons/'.Season::factory()->create()->id.'/nights', $body)->assertCreated();
});

it('opens a Main Event night, takes the answers and finishes it with the order of its players', function () {
    $keeper = User::factory()->resultsKeeper()->create();
    Sanctum::actingAs($keeper);
    $night = ($this->mainEvent)();

    $this->postJson("/api/v1/nights/{$night->id}/open")->assertOk()->assertJsonPath('data.status', 'open');
    $this->putJson("/api/v1/nights/{$night->id}/attendance/{$this->players[0]->id}", ['answer' => 'all_in'])->assertOk();

    $this->postJson("/api/v1/nights/{$night->id}/main-event-result", ['player_ids' => ($this->ids)(9)])
        ->assertOk()
        ->assertJsonPath('data.status', 'finished')
        ->assertJsonPath('data.pot', null)
        ->assertJsonPath('data.results', [])
        ->assertJsonCount(9, 'data.main_event_positions')
        ->assertJsonPath('data.main_event_positions.0.position', 1)
        ->assertJsonPath('data.main_event_positions.0.player.id', $this->players[0]->id)
        ->assertJsonPath('data.main_event_positions.8.position', 9)
        ->assertJsonPath('data.main_event_positions.8.player.id', $this->players[8]->id);

    $log = AuditLog::query()->where('action', 'night.finished')->where('user_id', $keeper->id)->sole();
    expect($log->after['main_event_player_ids'])->toBe(($this->ids)(9));
});

it('takes the champion alone, and a list longer than ten', function (int $count) {
    Sanctum::actingAs(User::factory()->admin()->create());
    $night = ($this->mainEvent)(['status' => 'open']);

    $this->postJson("/api/v1/nights/{$night->id}/main-event-result", ['player_ids' => ($this->ids)($count)])
        ->assertOk()->assertJsonCount($count, 'data.main_event_positions');
})->with([1, 12]);

it('corrects the result of a finished Main Event, also in a finished season, and records before and after', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $night = ($this->mainEvent)(['status' => 'open']);
    $this->postJson("/api/v1/nights/{$night->id}/main-event-result", ['player_ids' => ($this->ids)(4)])->assertOk();
    $this->season->update(['is_finished' => true, 'is_open' => false]);

    $corrected = [$this->players[1]->id, $this->players[0]->id];
    $this->postJson("/api/v1/nights/{$night->id}/main-event-result", ['player_ids' => $corrected])
        ->assertOk()
        ->assertJsonCount(2, 'data.main_event_positions')
        ->assertJsonPath('data.main_event_positions.0.player.id', $this->players[1]->id);

    $log = AuditLog::query()->where('action', 'night.corrected')->sole();
    expect($log->before['main_event_player_ids'])->toBe(($this->ids)(4))
        ->and($log->after['main_event_player_ids'])->toBe($corrected);
});

it('refuses a result with no 1st place, with a player twice or with an archived player', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $night = ($this->mainEvent)(['status' => 'open']);
    $url = "/api/v1/nights/{$night->id}/main-event-result";
    $archived = Player::factory()->archived()->create();

    $this->postJson($url, ['player_ids' => []])
        ->assertUnprocessable()
        ->assertJsonPath('errors', ['player_ids' => ['Informe pelo menos o 1º colocado.']]);
    $this->postJson($url, ['player_ids' => [$this->players[0]->id, $this->players[1]->id, $this->players[0]->id]])
        ->assertUnprocessable()
        ->assertJsonPath('errors', ['player_ids.2' => ['Este jogador já está na 1ª posição.']]);
    $this->postJson($url, ['player_ids' => [$this->players[0]->id, $archived->id]])
        ->assertUnprocessable()
        ->assertJsonPath('rule', 'night.main_event.unknown_player');
    expect($night->fresh()->status)->toBe('open');
});

it('does not finish a scheduled Main Event night', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $night = ($this->mainEvent)();

    $this->postJson("/api/v1/nights/{$night->id}/main-event-result", ['player_ids' => ($this->ids)(3)])
        ->assertConflict()->assertJsonPath('rule', 'night.finish.not_open');
});

it('keeps the two kinds of result apart', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $mainEvent = ($this->mainEvent)(['status' => 'open']);
    $positions = array_map(fn ($id, $i) => ['position' => $i + 1, 'player_id' => $id], ($this->ids)(6), range(0, 5));

    $this->postJson("/api/v1/nights/{$mainEvent->id}/finish", ['pot' => '300.00', 'main_event_pot' => '0', 'time_chip' => '0', 'positions' => $positions])
        ->assertUnprocessable()->assertJsonPath('rule', 'night.result.main_event_night');
    $this->putJson("/api/v1/nights/{$mainEvent->id}/partial-result", ['pot' => '300.00', 'main_event_pot' => null, 'time_chip' => null, 'positions' => []])
        ->assertUnprocessable()->assertJsonPath('rule', 'night.result.main_event_night');
    expect($mainEvent->fresh()->status)->toBe('open');

    $regular = Night::factory()->for(Season::factory()->create())->open()->create();
    $this->postJson("/api/v1/nights/{$regular->id}/main-event-result", ['player_ids' => ($this->ids)(3)])
        ->assertUnprocessable()->assertJsonPath('rule', 'night.main_event.regular_night');
});

it('moves and edits a Main Event night like any other, and keeps it extra', function () {
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());
    $place = Place::factory()->create();
    $night = ($this->mainEvent)(['starts_at' => '2027-12-11 13:00:00']);
    // A round on the day it moves to: an extra night may share a date.
    Night::factory()->for($this->season)->create(['starts_at' => '2027-12-18 21:30:00']);

    $this->postJson("/api/v1/nights/{$night->id}/reschedule", ['starts_at' => '2027-12-18 13:00:00'])
        ->assertOk()->assertJsonPath('data.starts_at', '2027-12-18T13:00:00-03:00');
    $this->patchJson("/api/v1/nights/{$night->id}", ['place_id' => $place->id, 'description' => 'Final', 'is_extra' => false])
        ->assertOk()
        ->assertJsonPath('data.place.id', $place->id)
        ->assertJsonPath('data.description', 'Final')
        ->assertJsonPath('data.is_extra', true);
});

it('records a past Main Event in one step, in a finished season too', function () {
    $keeper = User::factory()->admin()->create();
    Sanctum::actingAs($keeper);
    $this->season->update(['is_finished' => true, 'is_open' => false]);
    $url = "/api/v1/seasons/{$this->season->id}/main-event/import";

    $this->postJson($url, ['starts_at' => '2026-12-12 13:00:00', 'description' => 'Final de 2026', 'player_ids' => ($this->ids)(9)])
        ->assertCreated()
        ->assertJsonPath('data.type', 'main_event')
        ->assertJsonPath('data.is_extra', true)
        ->assertJsonPath('data.status', 'finished')
        ->assertJsonPath('data.description', 'Final de 2026')
        ->assertJsonPath('data.starts_at', '2026-12-12T13:00:00-03:00')
        ->assertJsonCount(9, 'data.main_event_positions');
    expect(AuditLog::query()->where('action', 'night.imported')->where('user_id', $keeper->id)->exists())->toBeTrue();

    $this->postJson($url, ['starts_at' => '2026-12-19 13:00:00', 'player_ids' => ($this->ids)(1)])
        ->assertUnprocessable()->assertJsonPath('rule', 'night.main_event.already_exists');
    $this->postJson($url, ['starts_at' => '2026-12-19 13:00:00', 'player_ids' => []])->assertUnprocessable();
    expect(Night::query()->count())->toBe(1);
});

it('lets only an admin add a Main Event to a season, while a results keeper runs its night', function () {
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());
    $body = ['starts_at' => '2026-12-12 13:00', 'player_ids' => ($this->ids)(3)];

    $this->postJson("/api/v1/seasons/{$this->season->id}/nights", ['starts_at' => '2026-12-12 13:00', 'type' => 'main_event'])->assertForbidden();
    $this->postJson("/api/v1/seasons/{$this->season->id}/main-event/import", $body)->assertForbidden();
    expect(Night::query()->count())->toBe(0);
    // A regular night is still the results keeper's to schedule.
    $this->postJson("/api/v1/seasons/{$this->season->id}/nights", ['starts_at' => '2026-12-11 21:30'])->assertCreated();

    $night = ($this->mainEvent)();
    $this->postJson("/api/v1/nights/{$night->id}/open")->assertOk();
    $this->postJson("/api/v1/nights/{$night->id}/main-event-result", ['player_ids' => ($this->ids)(3)])->assertOk();
});

it('lets only results keepers and admins record the result of a Main Event', function () {
    Sanctum::actingAs(User::factory()->create());
    $night = ($this->mainEvent)(['status' => 'open']);

    $this->postJson("/api/v1/nights/{$night->id}/main-event-result", ['player_ids' => ($this->ids)(3)])->assertForbidden();
    $this->postJson("/api/v1/seasons/{$this->season->id}/main-event/import", ['starts_at' => '2026-12-12 13:00', 'player_ids' => ($this->ids)(3)])->assertForbidden();
    $this->postJson("/api/v1/seasons/{$this->season->id}/nights", ['starts_at' => '2026-12-12 13:00', 'type' => 'main_event'])->assertForbidden();
});

it('leaves the Main Event out of the rounds, the standings and the statistics', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    ($this->finishRound)($this->season, ['starts_at' => '2027-03-12 21:30:00']);
    $night = ($this->mainEvent)(['status' => 'open', 'starts_at' => '2027-12-11 13:00:00']);
    // The champion of the Main Event did not score in the round.
    $this->postJson("/api/v1/nights/{$night->id}/main-event-result", ['player_ids' => [$this->players[11]->id, $this->players[0]->id]])->assertOk();

    $this->getJson("/api/v1/seasons/{$this->season->id}")->assertOk()
        ->assertJsonPath('data.nights_count', 1)
        ->assertJsonPath('data.nights_planned', 1);
    $this->getJson("/api/v1/seasons/{$this->season->id}/standings")->assertOk()
        ->assertJsonCount(6, 'data')
        ->assertJsonPath('data.0.player.id', $this->players[0]->id)
        ->assertJsonPath('data.0.points', '114.00');
    $this->getJson("/api/v1/statistics?season={$this->season->id}")->assertOk()
        ->assertJsonPath('data.nights_count', 1)
        ->assertJsonPath('data.pot_total', '300.00')
        ->assertJsonPath('data.main_event_pot_total', '60.00');
    $this->artisan('ptsite:verify')->assertSuccessful();
});

it('lists the Main Event night among the season nights and on the calendar, with its champion', function () {
    Sanctum::actingAs(User::factory()->create());
    $round = Night::factory()->for($this->season)->create(['starts_at' => '2027-12-11 21:30:00']);
    $night = ($this->mainEvent)(['status' => 'finished', 'starts_at' => '2027-12-11 13:00:00']);
    $night->mainEventPositions()->create(['position' => 1, 'player_id' => $this->players[3]->id]);

    $this->getJson("/api/v1/seasons/{$this->season->id}/nights")->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.id', $night->id)
        ->assertJsonPath('data.0.type', 'main_event')
        ->assertJsonPath('data.0.main_event_positions.0.player.id', $this->players[3]->id)
        ->assertJsonPath('data.1.id', $round->id)
        ->assertJsonPath('data.1.type', 'regular')
        ->assertJsonPath('data.1.main_event_positions', []);

    $nights = collect($this->getJson("/api/v1/seasons/{$this->season->id}/calendar")->assertOk()->json('data'))
        ->where('kind', 'night')->pluck('night')->keyBy('id');
    expect($nights[$night->id]['type'])->toBe('main_event')
        ->and($nights[$night->id]['is_extra'])->toBeTrue()
        ->and($nights[$night->id]['winner'])->toBe($this->players[3]->nickname)
        ->and($nights[$round->id]['type'])->toBe('regular');
});

it('shows the Main Event champion of each season in the first ten of every season', function () {
    Sanctum::actingAs(User::factory()->create());
    $played = $this->season;
    $played->update(['starts_on' => '2027-01-01']);
    $notPlayed = Season::factory()->create(['starts_on' => '2026-01-01']);
    Night::factory()->for($notPlayed)->create(['type' => 'main_event', 'is_extra' => true]);
    $night = ($this->mainEvent)(['status' => 'finished']);
    $night->mainEventPositions()->create(['position' => 1, 'player_id' => $this->players[3]->id]);
    $night->mainEventPositions()->create(['position' => 2, 'player_id' => $this->players[4]->id]);

    $this->getJson('/api/v1/seasons/top-standings')->assertOk()
        ->assertJsonPath('data.0.season.id', $played->id)
        ->assertJsonPath('data.0.main_event_champion.id', $this->players[3]->id)
        ->assertJsonPath('data.1.season.id', $notPlayed->id)
        ->assertJsonPath('data.1.main_event_champion', null);
});

it('has no Main Event on a site that did not turn it on', function () {
    config(['ptsite.features' => []]);
    Sanctum::actingAs(User::factory()->admin()->create());
    $night = ($this->mainEvent)(['status' => 'finished']);
    $night->mainEventPositions()->create(['position' => 1, 'player_id' => $this->players[3]->id]);

    $this->postJson("/api/v1/nights/{$night->id}/main-event-result", ['player_ids' => ($this->ids)(3)])->assertNotFound();
    $this->postJson("/api/v1/seasons/{$this->season->id}/main-event/import", ['starts_at' => '2026-12-12 13:00', 'player_ids' => ($this->ids)(3)])->assertNotFound();
    $this->postJson("/api/v1/seasons/{$this->season->id}/nights", ['starts_at' => '2026-12-12 13:00', 'type' => 'main_event'])
        ->assertUnprocessable()->assertJsonValidationErrors(['type']);
    $this->getJson('/api/v1/seasons/top-standings')->assertOk()->assertJsonPath('data.0.main_event_champion', null);
    // A regular night is scheduled as before.
    $this->postJson("/api/v1/seasons/{$this->season->id}/nights", ['starts_at' => '2026-12-12 13:00', 'type' => 'regular'])->assertCreated();
});
