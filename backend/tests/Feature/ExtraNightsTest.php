<?php

/*
 * Extra nights through the API, following docs/specs/seasons-and-nights.md: a night outside the season's
 * calendar. It is not a round and may share its date, but it scores like any other.
 */

use Laravel\Sanctum\Sanctum;
use PTSite\App\Models\Night;
use PTSite\App\Models\Player;
use PTSite\App\Models\Season;
use PTSite\App\Models\User;

beforeEach(function () {
    $this->season = Season::factory()->create([
        'starts_on' => '2027-01-01', 'schedule_weekday' => 5, 'schedule_time' => '21:30', 'schedule_every_weeks' => 2,
    ]);
    $this->players = Player::factory()->count(12)->create()->all();
    $this->result = fn (int $from) => [
        'pot' => '300.00', 'main_event_pot' => '0', 'time_chip' => '0',
        'positions' => array_map(fn ($p, $i) => ['position' => $i + 1, 'player_id' => $p->id], array_slice($this->players, $from, 6), range(0, 5)),
    ];
});

it('schedules an extra night on the date of a round, and does not count it as a round', function () {
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());
    Night::factory()->for($this->season)->create(['starts_at' => '2027-03-12 21:30:00']);

    $this->postJson("/api/v1/seasons/{$this->season->id}/nights", ['starts_at' => '2027-03-12 21:30', 'is_extra' => true, 'description' => 'Mesa paralela'])
        ->assertCreated()
        ->assertJsonPath('data.is_extra', true)
        ->assertJsonPath('data.type', 'regular');

    $this->getJson("/api/v1/seasons/{$this->season->id}")->assertOk()->assertJsonPath('data.nights_planned', 1);
    $this->getJson("/api/v1/seasons/{$this->season->id}/nights")->assertOk()->assertJsonCount(2, 'data');
});

it('schedules a night that is not extra when nothing is said', function () {
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());

    $this->postJson("/api/v1/seasons/{$this->season->id}/nights", ['starts_at' => '2027-03-12 21:30'])
        ->assertCreated()->assertJsonPath('data.is_extra', false)->assertJsonPath('data.type', 'regular');
});

it('still opens one night at a time, so the extra night is finished after the round', function () {
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());
    $round = Night::factory()->for($this->season)->open()->create(['starts_at' => '2027-03-12 21:30:00']);
    $extra = Night::factory()->for($this->season)->create(['starts_at' => '2027-03-12 21:30:00', 'is_extra' => true]);

    $this->postJson("/api/v1/nights/{$extra->id}/open")->assertConflict()->assertJsonPath('rule', 'night.open.another_open');

    $this->postJson("/api/v1/nights/{$round->id}/finish", ($this->result)(0))->assertOk();
    $this->postJson("/api/v1/nights/{$extra->id}/open")->assertOk();
    $this->postJson("/api/v1/nights/{$extra->id}/finish", ($this->result)(6))->assertOk()->assertJsonPath('data.is_extra', true);
});

it('counts the points and the amounts of an extra night, but not the night as a round', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $round = Night::factory()->for($this->season)->open()->create(['starts_at' => '2027-03-12 21:30:00']);
    $this->postJson("/api/v1/nights/{$round->id}/finish", ($this->result)(0))->assertOk();

    // The extra night is recorded afterwards, in one step.
    $this->postJson("/api/v1/seasons/{$this->season->id}/nights/import", ['starts_at' => '2027-03-12 21:30:00', 'is_extra' => true, ...($this->result)(6)])
        ->assertCreated()->assertJsonPath('data.is_extra', true)->assertJsonPath('data.status', 'finished');

    $this->getJson("/api/v1/seasons/{$this->season->id}")->assertOk()
        ->assertJsonPath('data.nights_count', 1)
        ->assertJsonPath('data.nights_planned', 1);
    // Both winners have the points of a 1st place.
    $this->getJson("/api/v1/seasons/{$this->season->id}/standings")->assertOk()
        ->assertJsonCount(12, 'data')
        ->assertJsonPath('data.0.points', '114.00')
        ->assertJsonPath('data.1.points', '114.00')
        ->assertJsonPath('data.1.rank', 1);
    $this->getJson("/api/v1/statistics?season={$this->season->id}")->assertOk()
        ->assertJsonPath('data.nights_count', 2)
        ->assertJsonPath('data.pot_total', '600.00');
});

it('moves a round onto a day that has only an extra night, and an extra night onto any day', function () {
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());
    $round = Night::factory()->for($this->season)->create(['starts_at' => '2027-03-12 21:30:00']);
    $other = Night::factory()->for($this->season)->create(['starts_at' => '2027-04-09 21:30:00']);
    $extra = Night::factory()->for($this->season)->create(['starts_at' => '2027-03-26 21:30:00', 'is_extra' => true]);

    $this->postJson("/api/v1/nights/{$round->id}/reschedule", ['starts_at' => '2027-03-26 21:30:00'])->assertOk();
    $this->postJson("/api/v1/nights/{$extra->id}/reschedule", ['starts_at' => '2027-04-09 20:00:00'])->assertOk();
    // Two rounds still do not share a day.
    $this->postJson("/api/v1/nights/{$other->id}/reschedule", ['starts_at' => '2027-03-26 20:00:00'])
        ->assertUnprocessable()->assertJsonPath('rule', 'night.date_taken');
});

it('keeps an extra night out of the season planner and of the suggested dates', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    // An extra night on a regular Friday: the plan still offers that day, and its rhythm starts on 08/01.
    Night::factory()->for($this->season)->create(['starts_at' => '2027-01-22 21:30:00', 'is_extra' => true]);

    $plan = $this->getJson("/api/v1/seasons/{$this->season->id}/night-plan?from=2027-01-04&to=2027-01-31")->assertOk()->json('data');
    expect(array_map(fn ($n) => substr($n['starts_at'], 0, 10).($n['taken'] ? ' taken' : ''), $plan))
        ->toBe(['2027-01-08', '2027-01-22']);

    $this->postJson("/api/v1/seasons/{$this->season->id}/nights/batch", ['starts_at' => ['2027-01-22 21:30']])->assertCreated();
    $this->getJson("/api/v1/seasons/{$this->season->id}")->assertOk()->assertJsonPath('data.nights_planned', 1);
});

it('marks a night as extra, or as a round again, when it is edited', function () {
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());
    $night = Night::factory()->for($this->season)->create(['starts_at' => '2027-03-12 21:30:00']);

    $this->patchJson("/api/v1/nights/{$night->id}", ['is_extra' => true])->assertOk()->assertJsonPath('data.is_extra', true);
    $this->getJson("/api/v1/seasons/{$this->season->id}")->assertOk()->assertJsonPath('data.nights_planned', 0);
    $this->patchJson("/api/v1/nights/{$night->id}", ['is_extra' => false])->assertOk()->assertJsonPath('data.is_extra', false);
});

it('shows an extra night on the calendar without changing the nights left out', function () {
    Sanctum::actingAs(User::factory()->create());
    Night::factory()->for($this->season)->create(['starts_at' => '2027-03-12 21:30:00']);
    $withRound = collect($this->getJson("/api/v1/seasons/{$this->season->id}/calendar")->json('data'))->where('kind', 'no_night')->pluck('starts_at')->all();

    Night::factory()->for($this->season)->create(['starts_at' => '2027-03-13 13:00:00', 'is_extra' => true]);
    $entries = collect($this->getJson("/api/v1/seasons/{$this->season->id}/calendar")->assertOk()->json('data'));

    expect($entries->where('kind', 'no_night')->pluck('starts_at')->all())->toBe($withRound)
        ->and($entries->where('kind', 'night')->pluck('night.is_extra')->all())->toBe([false, true]);
});
