<?php

/*
 * Seasons known only by their final standings, through the API, following docs/specs/season-totals.md:
 * "Temporada antiga" (3 rounds, final lines only) and "Temporada nova" (one night, R$ 300, won by Ana).
 */

use Laravel\Sanctum\Sanctum;
use PTSite\App\Models\AuditLog;
use PTSite\App\Models\Night;
use PTSite\App\Models\Player;
use PTSite\App\Models\Season;
use PTSite\App\Models\SeasonTotal;
use PTSite\App\Models\User;

beforeEach(function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $this->old = Season::factory()->create(['name' => 'Temporada antiga', 'starts_on' => '2009-01-01', 'rounds' => 3, 'is_open' => false]);
    $this->new = Season::factory()->create(['name' => 'Temporada nova', 'starts_on' => '2010-01-01']);
    $this->players = Player::factory()->count(7)->create()->all();
    [$this->ana, $this->breno] = $this->players;
    $this->rows = fn (int $brenoWins = 1) => array_map(fn (Player $player, array $line) => [
        'player_id' => $player->id, 'points' => $line[0], 'positions' => $line[1],
    ], $this->players, [
        ['250.50', [2, 0, 0, 1, 0, 0]],
        ['180.00', [$brenoWins, 1, 0, 0, 1, 0]],
        ['120.00', [0, 1, 1, 0, 0, 1]],
        ['90.00', [0, 1, 1, 0, 0, 0]],
        ['60.00', [0, 0, 1, 1, 1, 0]],
        ['30.00', [0, 0, 0, 1, 0, 1]],
        ['12.50', [0, 0, 0, 0, 1, 1]],
    ]);
    $this->url = "/api/v1/seasons/{$this->old->id}/totals";
    $this->finishNewNight = function () {
        $night = Night::factory()->for($this->new)->open()->create(['starts_at' => '2010-03-05 21:30:00']);
        $this->postJson("/api/v1/nights/{$night->id}/finish", [
            'pot' => '300.00', 'main_event_pot' => '0', 'time_chip' => '0',
            'positions' => array_map(fn (Player $p, int $i) => ['position' => $i + 1, 'player_id' => $p->id], array_slice($this->players, 0, 6), range(0, 5)),
        ])->assertOk();

        return $night;
    };
});

it('saves the final standings of a season and returns its standings', function () {
    $this->putJson($this->url, ['rows' => ($this->rows)()])->assertOk()
        ->assertJsonCount(7, 'data')
        ->assertJsonPath('data.0.rank', 1)
        ->assertJsonPath('data.0.player.id', $this->ana->id)
        ->assertJsonPath('data.0.points', '250.50')
        ->assertJsonPath('data.0.nights_scored', 3)
        ->assertJsonPath('data.0.wins', 2)
        ->assertJsonPath('data.6.points', '12.50');

    $this->getJson("/api/v1/seasons/{$this->old->id}")->assertOk()
        ->assertJsonPath('data.totals_only', true)
        ->assertJsonPath('data.nights_count', 0);
    $this->getJson("/api/v1/seasons/{$this->new->id}")->assertOk()->assertJsonPath('data.totals_only', false);
    expect(AuditLog::query()->where('action', 'season.totals_saved')->count())->toBe(1);
});

it('replaces the final lines, so saving them twice changes nothing, and saving none clears them', function () {
    $this->putJson($this->url, ['rows' => ($this->rows)()])->assertOk();
    $this->putJson($this->url, ['rows' => ($this->rows)()])->assertOk();
    expect(SeasonTotal::query()->count())->toBe(7);

    $this->putJson($this->url, ['rows' => []])->assertOk()->assertJsonCount(0, 'data');
    expect(SeasonTotal::query()->count())->toBe(0);
    $this->getJson("/api/v1/seasons/{$this->old->id}")->assertJsonPath('data.totals_only', false);
});

it('lets only an admin save the final standings', function () {
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());

    $this->putJson($this->url, ['rows' => ($this->rows)()])->assertForbidden();
});

it('keeps final lines whose counts in a position do not add up to the rounds, as the league recorded them', function () {
    $this->putJson($this->url, ['rows' => ($this->rows)(brenoWins: 2)])->assertOk()
        ->assertJsonPath('data.1.wins', 2)
        ->assertJsonPath('data.1.nights_scored', 4);
});

it('refuses a player listed twice, and an archived player', function () {
    $rows = ($this->rows)();
    $this->putJson($this->url, ['rows' => [...$rows, $rows[0]]])->assertUnprocessable()
        ->assertJsonPath('rule', 'season.totals.duplicate_player')
        ->assertJsonPath('message', 'Este jogador aparece duas vezes.');

    $this->ana->forceFill(['archived_at' => now()])->save();
    $this->putJson($this->url, ['rows' => $rows])->assertUnprocessable()->assertJsonPath('rule', 'season.totals.unknown_player');
});

it('refuses final lines for a season with a finished night', function () {
    ($this->finishNewNight)();

    $this->putJson("/api/v1/seasons/{$this->new->id}/totals", ['rows' => ($this->rows)()])->assertUnprocessable()
        ->assertJsonPath('rule', 'season.totals.has_nights')
        ->assertJsonPath('message', 'Esta temporada já tem eventos: o resultado final vem deles.');
});

it('takes no regular night and no simulation in a season known only by its final standings, but takes its Main Event', function () {
    $this->putJson($this->url, ['rows' => ($this->rows)()])->assertOk();
    $positions = array_map(fn (Player $p, int $i) => ['position' => $i + 1, 'player_id' => $p->id], array_slice($this->players, 0, 6), range(0, 5));

    $this->postJson("/api/v1/seasons/{$this->old->id}/nights", ['starts_at' => '2009-03-06 21:30'])->assertUnprocessable()
        ->assertJsonPath('rule', 'season.totals_only')
        ->assertJsonPath('message', 'Esta temporada tem só o resultado final: não recebe eventos.');
    $this->postJson("/api/v1/seasons/{$this->old->id}/nights/import", [
        'starts_at' => '2009-03-06 21:30', 'pot' => '300.00', 'main_event_pot' => '0', 'time_chip' => '0', 'positions' => $positions,
    ])->assertUnprocessable()->assertJsonPath('rule', 'season.totals_only');
    $this->postJson("/api/v1/seasons/{$this->old->id}/simulate", ['pot' => '300.00', 'positions' => $positions])
        ->assertUnprocessable()->assertJsonPath('rule', 'season.totals_only');

    $this->postJson("/api/v1/seasons/{$this->old->id}/main-event/import", [
        'starts_at' => '2009-12-12 13:00:00', 'player_ids' => array_map(fn (Player $p) => $p->id, $this->players),
    ])->assertCreated();
    expect(Night::query()->where('season_id', $this->old->id)->count())->toBe(1);
});

it('refuses to change the percentages of a season known only by its final standings', function () {
    $this->putJson($this->url, ['rows' => ($this->rows)()])->assertOk();

    $this->patchJson("/api/v1/seasons/{$this->old->id}", ['percentages' => array_map(
        fn (int $position, int $percent) => ['position' => $position, 'percent' => $percent], range(1, 6), [40, 23, 15, 10, 8, 4],
    )])->assertUnprocessable()->assertJsonPath('rule', 'season.totals.locked');
    $this->patchJson("/api/v1/seasons/{$this->old->id}", ['rounds' => 3, 'description' => 'Só o resultado final'])->assertOk();
});

it('counts a season known only by its final standings in the statistics of every season, but not in the pots', function () {
    $this->putJson($this->url, ['rows' => ($this->rows)()])->assertOk();
    $night = ($this->finishNewNight)();

    $this->getJson('/api/v1/statistics')->assertOk()
        ->assertJsonPath('data.nights_count', 4)
        ->assertJsonPath('data.pot_total', '300.00')
        ->assertJsonPath('data.total_points.rows.0.player.id', $this->ana->id)
        ->assertJsonPath('data.total_points.rows.0.amount', '364.50')
        ->assertJsonPath('data.positions.0.rows.0.count', 3)
        ->assertJsonCount(1, 'data.biggest_pots.rows')
        ->assertJsonPath('data.biggest_pots.rows.0.night.id', $night->id)
        ->assertJsonPath('data.points_progress.steps.0.season_name', 'Temporada antiga')
        ->assertJsonPath('data.points_progress.steps.1.season_name', 'Temporada nova')
        ->assertJsonPath('data.points_progress.series.0.points', ['250.50', '364.50']);

    $this->getJson("/api/v1/statistics?season={$this->old->id}")->assertOk()
        ->assertJsonPath('data.nights_count', 3)
        ->assertJsonPath('data.total_points.rows.0.amount', '250.50')
        ->assertJsonCount(0, 'data.points_progress.steps')
        ->assertJsonCount(0, 'data.biggest_pots.rows');
});

it('counts the champion of a season known only by its final standings once it is finished', function () {
    $this->putJson($this->url, ['rows' => ($this->rows)()])->assertOk();

    $this->getJson('/api/v1/statistics')->assertOk()->assertJsonPath('data.championships.count', 0);

    $this->old->update(['is_finished' => true]);
    $this->getJson('/api/v1/statistics')->assertOk()
        ->assertJsonPath('data.championships.count', 1)
        ->assertJsonPath('data.championships.titles.rows.0.player.id', $this->ana->id);
});

it('lists a season known only by its final standings on a player\'s page, with no result of a night', function () {
    $this->putJson($this->url, ['rows' => ($this->rows)()])->assertOk();
    $night = ($this->finishNewNight)();

    $this->getJson("/api/v1/players/{$this->ana->id}/statistics")->assertOk()
        ->assertJsonPath('data.points', '364.50')
        ->assertJsonPath('data.wins', 3)
        ->assertJsonPath('data.seasons.1.season_name', 'Temporada antiga')
        ->assertJsonPath('data.seasons.1.rank', 1)
        ->assertJsonPath('data.seasons.1.points', '250.50')
        ->assertJsonPath('data.seasons.1.nights_scored', 3)
        ->assertJsonCount(1, 'data.results')
        ->assertJsonPath('data.results.0.night_id', $night->id);
});

it('shows a season known only by its final standings among the seasons\' top standings, and leaves it out once archived', function () {
    $this->putJson($this->url, ['rows' => ($this->rows)()])->assertOk();

    $this->getJson('/api/v1/seasons/top-standings')->assertOk()
        ->assertJsonPath('data.1.season.name', 'Temporada antiga')
        ->assertJsonPath('data.1.season.totals_only', true)
        ->assertJsonPath('data.1.rows.0.player.id', $this->ana->id);

    $this->old->forceFill(['archived_at' => now()])->save();
    $this->getJson('/api/v1/statistics')->assertOk()->assertJsonPath('data.nights_count', 0);
});
