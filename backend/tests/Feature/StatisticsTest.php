<?php

use Laravel\Sanctum\Sanctum;
use PTSite\App\Models\Night;
use PTSite\App\Models\Place;
use PTSite\App\Models\Player;
use PTSite\App\Models\Season;
use PTSite\App\Models\User;

/*
 * The three nights of docs/specs/statistics.md, finished through the API: seasons A and B, Ana, Breno and Carla
 * (plus filler players in the other scoring positions).
 */
beforeEach(function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    [$this->seasonA, $this->seasonB] = Season::factory()->count(2)->create()->all();
    [$this->ana, $this->breno, $this->carla] = Player::factory()->count(3)->create()->all();
    $this->others = Player::factory()->count(4)->create()->all();
    [$this->home, $this->bar] = Place::factory()->count(2)->create()->all();

    $this->finish = function (Season $season, Place $place, string $pot, string $day, array $order): Night {
        $night = Night::factory()->for($season)->open()->create(['place_id' => $place->id, 'starts_at' => "{$day} 21:30:00"]);
        $order = [...$order, ...array_slice($this->others, 0, 6 - count($order))];
        $this->postJson("/api/v1/nights/{$night->id}/finish", [
            'pot' => $pot,
            'main_event_pot' => '30',
            'time_chip' => '20',
            'positions' => array_map(fn ($p, $i) => ['position' => $i + 1, 'player_id' => $p->id], $order, array_keys($order)),
        ])->assertOk();

        return $night;
    };
    $this->night1 = ($this->finish)($this->seasonA, $this->home, '300.00', '2026-03-06', [$this->ana, $this->breno, $this->carla]);
    $this->night2 = ($this->finish)($this->seasonA, $this->bar, '400.00', '2026-03-20', [$this->breno, $this->carla, $this->ana]);
    $this->night3 = ($this->finish)($this->seasonB, $this->home, '300.00', '2026-08-07', [$this->ana, $this->carla]);
});

it('shows the statistics of every season', function () {
    $this->getJson('/api/v1/statistics')->assertOk()
        ->assertJsonPath('data.season_id', null)
        ->assertJsonPath('data.nights_count', 3)
        ->assertJsonPath('data.pot_total', '1000.00')
        ->assertJsonPath('data.main_event_pot_total', '90.00')
        ->assertJsonPath('data.time_chip_total', '60.00')
        ->assertJsonPath('data.total_points.rows.0.player.id', $this->ana->id)
        ->assertJsonPath('data.total_points.rows.0.amount', '288.00')
        ->assertJsonPath('data.total_points.rows.1.player.id', $this->breno->id)
        ->assertJsonPath('data.total_points.rows.1.amount', '221.00')
        ->assertJsonPath('data.positions.0.position', 1)
        ->assertJsonPath('data.positions.0.rows.0.player.id', $this->ana->id)
        ->assertJsonPath('data.positions.0.rows.0.count', 2)
        ->assertJsonPath('data.biggest_pots.rows.0.night.id', $this->night2->id)
        ->assertJsonPath('data.biggest_pots.rows.0.night.season_name', $this->seasonA->name)
        ->assertJsonPath('data.biggest_pots.rows.0.amount', '400.00')
        ->assertJsonPath('data.biggest_pots.rows.1.rank', 2)
        ->assertJsonPath('data.biggest_pots.rows.2.rank', 2)
        ->assertJsonPath('data.places.rows.0.place.id', $this->home->id)
        ->assertJsonPath('data.places.rows.0.count', 2)
        ->assertJsonPath('data.points_progress.steps.0.season_id', $this->seasonA->id)
        ->assertJsonPath('data.points_progress.steps.0.night_id', null)
        ->assertJsonPath('data.points_progress.steps.1.season_name', $this->seasonB->name)
        ->assertJsonPath('data.points_progress.series.0.player.id', $this->ana->id)
        ->assertJsonPath('data.points_progress.series.0.points', ['174.00', '288.00'])
        ->assertJsonPath('data.points_progress.pots', ['700.00', '300.00'])
        ->assertJsonPath('data.wins_not_shown', 0)
        ->assertJsonCount(7, 'data.position_table')
        ->assertJsonPath('data.position_table.0.rank', 1)
        ->assertJsonPath('data.position_table.0.player.id', $this->ana->id)
        ->assertJsonPath('data.position_table.0.positions.0', ['position' => 1, 'count' => 2])
        ->assertJsonPath('data.position_table.0.positions.1', ['position' => 2, 'count' => 0])
        ->assertJsonPath('data.position_table.1.player.id', $this->breno->id)
        ->assertJsonCount(6, 'data.position_table.0.positions');
});

it('shows the statistics of one season', function () {
    $this->getJson("/api/v1/statistics?season={$this->seasonA->id}")->assertOk()
        ->assertJsonPath('data.season_id', $this->seasonA->id)
        ->assertJsonPath('data.nights_count', 2)
        ->assertJsonPath('data.total_points.rows.0.player.id', $this->breno->id)
        ->assertJsonPath('data.total_points.rows.0.amount', '221.00')
        ->assertJsonPath('data.points_progress.steps.0.night_id', $this->night1->id)
        ->assertJsonPath('data.points_progress.steps.1.night_id', $this->night2->id)
        ->assertJsonPath('data.points_progress.series.0.points', ['69.00', '221.00'])
        ->assertJsonPath('data.points_progress.pots', ['300.00', '400.00']);
});

it('leaves out archived nights and, over every season, archived seasons', function () {
    $this->night2->forceFill(['archived_at' => now()])->save();
    $this->seasonB->forceFill(['archived_at' => now()])->save();

    $this->getJson('/api/v1/statistics')->assertOk()
        ->assertJsonPath('data.nights_count', 1)
        ->assertJsonPath('data.pot_total', '300.00');
    // A season asked for by id is shown even when archived, as its standings are.
    $this->getJson("/api/v1/statistics?season={$this->seasonB->id}")->assertOk()->assertJsonPath('data.nights_count', 1);
});

it('is empty before any night is finished', function () {
    $season = Season::factory()->create();

    $this->getJson("/api/v1/statistics?season={$season->id}")->assertOk()
        ->assertJsonPath('data.nights_count', 0)
        ->assertJsonPath('data.total_points.rows', [])
        ->assertJsonPath('data.positions', [])
        ->assertJsonPath('data.points_progress.series', []);
});

it('shows one player\'s statistics over every season', function () {
    $this->getJson("/api/v1/players/{$this->ana->id}/statistics")->assertOk()
        ->assertJsonPath('data.season_id', null)
        ->assertJsonPath('data.rank', 1)
        ->assertJsonPath('data.points', '288.00')
        ->assertJsonPath('data.nights_scored', 3)
        ->assertJsonPath('data.wins', 2)
        ->assertJsonPath('data.positions.0', ['position' => 1, 'count' => 2])
        ->assertJsonPath('data.positions.1', ['position' => 2, 'count' => 0])
        ->assertJsonPath('data.positions.2', ['position' => 3, 'count' => 1])
        ->assertJsonCount(6, 'data.positions')
        ->assertJsonPath('data.seasons.0', [
            'season_id' => $this->seasonB->id, 'season_name' => $this->seasonB->name,
            'rank' => 1, 'points' => '114.00', 'nights_scored' => 1, 'wins' => 1,
        ])
        ->assertJsonPath('data.seasons.1.season_id', $this->seasonA->id)
        ->assertJsonPath('data.seasons.1.rank', 2)
        ->assertJsonPath('data.seasons.1.points', '174.00')
        ->assertJsonPath('data.results.0', [
            'night_id' => $this->night3->id, 'starts_at' => $this->night3->starts_at->toIso8601String(),
            'season_id' => $this->seasonB->id, 'season_name' => $this->seasonB->name,
            'position' => 1, 'points' => '114.00',
        ])
        ->assertJsonPath('data.results.1.night_id', $this->night2->id)
        ->assertJsonPath('data.results.1.position', 3)
        ->assertJsonPath('data.results.1.points', '60.00')
        ->assertJsonCount(3, 'data.results')
        ->assertJsonPath('data.points_progress.steps.0.season_id', $this->seasonA->id)
        ->assertJsonPath('data.points_progress.steps.0.night_id', null)
        ->assertJsonPath('data.points_progress.points', ['174.00', '288.00']);

    // Breno scored in season A only.
    $this->getJson("/api/v1/players/{$this->breno->id}/statistics")->assertOk()
        ->assertJsonCount(1, 'data.seasons')
        ->assertJsonPath('data.seasons.0.season_id', $this->seasonA->id)
        ->assertJsonPath('data.points_progress.points', ['221.00', '221.00']);
});

it('shows one player\'s statistics in one season, to any logged-in user', function () {
    Sanctum::actingAs(User::factory()->create());

    $this->getJson("/api/v1/players/{$this->ana->id}/statistics?season={$this->seasonA->id}")->assertOk()
        ->assertJsonPath('data.season_id', $this->seasonA->id)
        ->assertJsonPath('data.rank', 2)
        ->assertJsonPath('data.points', '174.00')
        ->assertJsonPath('data.nights_scored', 2)
        ->assertJsonPath('data.wins', 1)
        ->assertJsonCount(1, 'data.seasons')
        ->assertJsonCount(2, 'data.results')
        ->assertJsonPath('data.points_progress.steps.0.night_id', $this->night1->id)
        ->assertJsonPath('data.points_progress.points', ['114.00', '174.00']);
});

it('shows zeros for a player who never scored', function () {
    $dudu = Player::factory()->create();

    $this->getJson("/api/v1/players/{$dudu->id}/statistics")->assertOk()
        ->assertJsonPath('data.rank', null)
        ->assertJsonPath('data.points', '0.00')
        ->assertJsonPath('data.nights_scored', 0)
        ->assertJsonPath('data.positions.0', ['position' => 1, 'count' => 0])
        ->assertJsonPath('data.seasons', [])
        ->assertJsonPath('data.results', [])
        ->assertJsonPath('data.points_progress.points', ['0.00', '0.00']);
});

it('leaves archived nights and archived seasons out of a player\'s statistics', function () {
    $this->night2->forceFill(['archived_at' => now()])->save();
    $this->seasonB->forceFill(['archived_at' => now()])->save();

    $this->getJson("/api/v1/players/{$this->ana->id}/statistics")->assertOk()
        ->assertJsonPath('data.points', '114.00')
        ->assertJsonCount(1, 'data.results')
        ->assertJsonCount(1, 'data.seasons');
});

it('needs a login for a player\'s statistics', function () {
    $this->app['auth']->forgetGuards();

    $this->getJson("/api/v1/players/{$this->ana->id}/statistics")->assertUnauthorized();
});

it('refuses a season that does not exist', function () {
    $this->getJson('/api/v1/statistics?season=999999')->assertUnprocessable();
});

it('needs a login', function () {
    $this->app['auth']->forgetGuards();

    $this->getJson('/api/v1/statistics')->assertUnauthorized();
});
