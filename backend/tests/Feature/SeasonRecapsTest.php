<?php

/*
 * Season recaps and the digest through the API, following docs/specs/season-recaps.md.
 */

use Laravel\Sanctum\Sanctum;
use PTSite\App\Models\AuditLog;
use PTSite\App\Models\Night;
use PTSite\App\Models\NightPlayer;
use PTSite\App\Models\NightRebuy;
use PTSite\App\Models\Player;
use PTSite\App\Models\Season;
use PTSite\App\Models\SeasonRecap;
use PTSite\App\Models\User;

beforeEach(function () {
    config(['ptsite.features' => ['seasonRecaps' => true]]);
    $this->season = Season::factory()->create(['rounds' => 26]);
    $this->players = Player::factory()->count(7)->create()->all();
    $this->admin = User::factory()->admin()->create();
    $this->writer = User::factory()->writer()->create(['name' => 'cronista']);
    // Finishes a night of the season with the players in this order, by index.
    $this->finish = function (array $order, string $startsAt, string $pot = '600.00', ?Season $season = null) {
        Sanctum::actingAs($this->admin);
        $night = Night::factory()->for($season ?? $this->season)->open()->create(['starts_at' => $startsAt]);
        $this->postJson("/api/v1/nights/{$night->id}/finish", [
            'pot' => $pot, 'main_event_pot' => '0', 'time_chip' => '0',
            'positions' => array_map(fn (int $index, int $i) => ['position' => $i + 1, 'player_id' => $this->players[$index]->id], $order, array_keys($order)),
        ])->assertOk();

        return $night;
    };
});

it('writes a published recap about a night, and everyone reads it', function () {
    $night = ($this->finish)([0, 1, 2, 3, 4, 5], '2026-03-06 21:30:00');
    Sanctum::actingAs($this->writer);

    $this->postJson("/api/v1/seasons/{$this->season->id}/recaps", ['night_id' => $night->id, 'body' => "Breno virou o jogo!\nE agora?"])
        ->assertCreated()
        ->assertJsonPath('data.published', true)
        ->assertJsonPath('data.night.id', $night->id)
        ->assertJsonPath('data.author', 'cronista');
    expect(AuditLog::query()->where('action', 'recap.created')->value('user_id'))->toBe($this->writer->id);

    Sanctum::actingAs(User::factory()->create());
    $this->getJson("/api/v1/seasons/{$this->season->id}/recaps")->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.body', "Breno virou o jogo!\nE agora?");
});

it('takes one recap per night', function () {
    $night = ($this->finish)([0, 1, 2, 3, 4, 5], '2026-03-06 21:30:00');
    Sanctum::actingAs($this->writer);
    $this->postJson("/api/v1/seasons/{$this->season->id}/recaps", ['night_id' => $night->id, 'body' => 'Um.'])->assertCreated();

    $this->postJson("/api/v1/seasons/{$this->season->id}/recaps", ['night_id' => $night->id, 'body' => 'Dois.'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.night_id.0', 'Este evento já tem uma crônica.');
});

it('refuses a night of another season and a night not finished yet', function () {
    $other = ($this->finish)([0, 1, 2, 3, 4, 5], '2026-03-06 21:30:00', season: Season::factory()->create());
    $scheduled = Night::factory()->for($this->season)->create();
    Sanctum::actingAs($this->writer);

    $this->postJson("/api/v1/seasons/{$this->season->id}/recaps", ['night_id' => $other->id, 'body' => 'x'])
        ->assertJsonPath('errors.night_id.0', 'Este evento é de outra temporada.');
    $this->postJson("/api/v1/seasons/{$this->season->id}/recaps", ['night_id' => $scheduled->id, 'body' => 'x'])
        ->assertJsonPath('errors.night_id.0', 'Escolha um evento finalizado.');
});

it('keeps a draft from players until it is published', function () {
    Sanctum::actingAs($this->writer);
    $id = $this->postJson("/api/v1/seasons/{$this->season->id}/recaps", ['body' => 'Rascunho.', 'published' => false])
        ->assertCreated()->assertJsonPath('data.published', false)->json('data.id');

    Sanctum::actingAs(User::factory()->create());
    $this->getJson("/api/v1/seasons/{$this->season->id}/recaps")->assertJsonCount(0, 'data');

    Sanctum::actingAs($this->admin);
    $this->getJson("/api/v1/seasons/{$this->season->id}/recaps")->assertJsonCount(1, 'data');
    $this->patchJson("/api/v1/recaps/{$id}", ['published' => true])->assertOk()->assertJsonPath('data.published', true);

    Sanctum::actingAs(User::factory()->create());
    $this->getJson("/api/v1/seasons/{$this->season->id}/recaps")->assertJsonCount(1, 'data');
});

it('changes and deletes a recap, and the audit log keeps the deleted text', function () {
    Sanctum::actingAs($this->writer);
    $id = $this->postJson("/api/v1/seasons/{$this->season->id}/recaps", ['body' => 'Antes.'])->json('data.id');

    $this->patchJson("/api/v1/recaps/{$id}", ['body' => 'Depois.'])->assertOk()->assertJsonPath('data.body', 'Depois.');
    $this->deleteJson("/api/v1/recaps/{$id}")->assertNoContent();

    expect(SeasonRecap::query()->count())->toBe(0)
        ->and(AuditLog::query()->where('action', 'recap.deleted')->sole()->before['body'])->toBe('Depois.');
});

it('lets only writers and admins write recaps', function () {
    $recap = SeasonRecap::query()->create(['season_id' => $this->season->id, 'body' => 'x', 'published_at' => now()]);

    foreach ([User::factory()->create(), User::factory()->resultsKeeper()->create()] as $user) {
        Sanctum::actingAs($user);
        $this->postJson("/api/v1/seasons/{$this->season->id}/recaps", ['body' => 'x'])->assertForbidden();
        $this->patchJson("/api/v1/recaps/{$recap->id}", ['body' => 'y'])->assertForbidden();
        $this->deleteJson("/api/v1/recaps/{$recap->id}")->assertForbidden();
    }
});

it('refuses a text over 4000 characters', function () {
    Sanctum::actingAs($this->writer);

    $this->postJson("/api/v1/seasons/{$this->season->id}/recaps", ['body' => str_repeat('a', 4001)])->assertJsonValidationErrors('body');
    $this->postJson("/api/v1/seasons/{$this->season->id}/recaps", ['body' => str_repeat('a', 4000)])->assertCreated();
});

it('creates and publishes nothing on a site without recaps, but keeps drafts and the digest', function () {
    config(['ptsite.features' => ['seasonRecaps' => false]]);
    $draft = SeasonRecap::query()->create(['season_id' => $this->season->id, 'body' => 'Rascunho.']);
    Sanctum::actingAs($this->writer);

    $this->postJson("/api/v1/seasons/{$this->season->id}/recaps", ['body' => 'x'])->assertNotFound();
    $this->patchJson("/api/v1/recaps/{$draft->id}", ['published' => true])
        ->assertJsonPath('errors.published.0', 'Este site não publica crônicas. Salve como rascunho.');
    $this->patchJson("/api/v1/recaps/{$draft->id}", ['body' => 'Outro rascunho.'])->assertOk();
    $this->getJson("/api/v1/seasons/{$this->season->id}/digest")->assertOk();
});

it('gives the digest: the standings and how they moved on the latest night', function () {
    // Pot R$ 600 with the factory's table; the first places of night 1 are Ana (0) and Breno (1).
    ($this->finish)([0, 1, 2, 3, 4, 5], '2026-03-06 21:30:00');
    $latest = ($this->finish)([1, 6, 2, 3, 4, 5], '2026-03-13 21:30:00');
    Night::factory()->for($this->season)->create(['starts_at' => '2026-03-20 21:30:00']);
    Sanctum::actingAs($this->writer);
    $this->postJson("/api/v1/seasons/{$this->season->id}/recaps", ['night_id' => $latest->id, 'body' => 'Breno virou o jogo!'])->assertCreated();

    $digest = $this->getJson("/api/v1/seasons/{$this->season->id}/digest")->assertOk()
        ->assertJsonPath('data.season.rounds_played', 2)
        ->assertJsonPath('data.season.rounds_left', 24)
        ->assertJsonPath('data.latest_night.id', $latest->id)
        ->assertJsonPath('data.latest_night.results.0.player.id', $this->players[1]->id)
        ->assertJsonPath('data.next_night.starts_at', fn ($at) => str_starts_with($at, '2026-03-20'))
        ->assertJsonPath('data.recaps.0.body', 'Breno virou o jogo!')
        ->json('data.standings');

    $breno = collect($digest)->firstWhere('player.id', $this->players[1]->id);
    $ana = collect($digest)->firstWhere('player.id', $this->players[0]->id);
    $gabi = collect($digest)->firstWhere('player.id', $this->players[6]->id);
    expect($breno['rank'])->toBe(1)
        ->and($breno['previous_rank'])->toBe(2)
        ->and($breno['form'])->toBe([2, 1])
        ->and($breno['gap_to_leader'])->toBe('0.00')
        ->and($ana['previous_rank'])->toBe(1)
        ->and($ana['form'])->toBe([1, null])
        ->and($ana['points_on_latest_night'])->toBe('0.00')
        ->and($gabi['previous_rank'])->toBeNull()
        ->and($gabi['form'])->toBe([null, 2]);
});

it('gives each player\'s rebuys and time chips in the digest, on a site with the night dashboard', function () {
    config(['ptsite.features' => ['seasonRecaps' => true, 'nightDashboard' => true]]);
    $this->season->update(['rebuys_allowed' => 1, 'rebuy_charges_time_chip' => true]);
    $first = ($this->finish)([0, 1, 2, 3, 4, 5], '2026-03-06 21:30:00', '600.00');
    $latest = ($this->finish)([1, 6, 2, 3, 4, 5], '2026-03-13 21:30:00', '600.00');
    [$ana, $breno] = $this->players;
    // Ana: two rebuys on the first night, one past the limit. Breno: late and one rebuy on the latest night.
    NightRebuy::query()->create(['night_id' => $first->id, 'player_id' => $ana->id]);
    NightRebuy::query()->create(['night_id' => $first->id, 'player_id' => $ana->id]);
    NightRebuy::query()->create(['night_id' => $latest->id, 'player_id' => $breno->id]);
    NightPlayer::query()->create(['night_id' => $latest->id, 'player_id' => $breno->id, 'time_chip_at' => now()]);
    $latest->update(['time_chip' => '30.00']);
    Sanctum::actingAs($this->writer);

    $money = $this->getJson("/api/v1/seasons/{$this->season->id}/digest")->assertOk()
        ->assertJsonPath('data.season.time_chip_total', '30.00')
        ->json('data.money');

    expect($money)->toHaveCount(2)
        ->and($money[0]['player']['id'])->toBe($ana->id)
        ->and($money[0]['season'])->toBe(['rebuys' => 2, 'money_only_rebuys' => 1, 'late_arrivals' => 0, 'time_chips' => 2])
        ->and($money[0]['latest_night'])->toBe(['rebuys' => 0, 'money_only_rebuys' => 0, 'late_arrivals' => 0, 'time_chips' => 0])
        ->and($money[1]['latest_night'])->toBe(['rebuys' => 1, 'money_only_rebuys' => 0, 'late_arrivals' => 1, 'time_chips' => 2]);
});

it('has no rebuys in the digest on a site with no night dashboard', function () {
    Sanctum::actingAs($this->writer);

    $this->getJson("/api/v1/seasons/{$this->season->id}/digest")->assertOk()->assertJsonPath('data.money', null);
});

it('gives an empty digest before the first night', function () {
    Sanctum::actingAs($this->writer);

    $this->getJson("/api/v1/seasons/{$this->season->id}/digest")->assertOk()
        ->assertJsonPath('data.latest_night', null)
        ->assertJsonPath('data.standings', [])
        ->assertJsonPath('data.season.rounds_left', 26);
});
