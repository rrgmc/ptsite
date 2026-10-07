<?php

/*
 * The partial result through the API, following the examples in docs/specs/seasons-and-nights.md.
 */

use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use PTSite\App\Models\AuditLog;
use PTSite\App\Models\Night;
use PTSite\App\Models\NightPartialResult;
use PTSite\App\Models\Player;
use PTSite\App\Models\Season;
use PTSite\App\Models\User;

afterEach(fn () => Carbon::setTestNow());

beforeEach(function () {
    $this->season = Season::factory()->create();
    $this->night = Night::factory()->for($this->season)->open()->create(['starts_at' => '2025-03-14 21:30:00']);
    foreach (['ana' => 'Ana', 'breno' => 'Breno', 'carla' => 'Carla', 'dudu' => 'Dudu'] as $key => $nickname) {
        $this->{$key} = Player::factory()->create(['nickname' => $nickname]);
        $this->{"{$key}User"} = User::factory()->create(['player_id' => $this->{$key}->id, 'name' => $nickname]);
    }
    $this->url = "/api/v1/nights/{$this->night->id}/partial-result";
    /** @param array<int, Player> $positions position => player */
    $this->save = function (User $as, array $positions = [], ?string $pot = null, ?string $mainEventPot = null, ?string $timeChip = null) {
        Sanctum::actingAs($as);

        return $this->putJson($this->url, [
            'pot' => $pot,
            'main_event_pot' => $mainEventPot,
            'time_chip' => $timeChip,
            'positions' => collect($positions)->map(fn (Player $p, int $position) => ['position' => $position, 'player_id' => $p->id])->values()->all(),
        ]);
    };
});

it('answers an empty partial result when nobody saved one', function () {
    Sanctum::actingAs($this->anaUser);

    $this->getJson($this->url)
        ->assertOk()
        ->assertJsonPath('data.pot', null)
        ->assertJsonPath('data.main_event_pot', null)
        ->assertJsonPath('data.time_chip', null)
        ->assertJsonPath('data.positions', [])
        ->assertJsonPath('data.saved_by', null)
        ->assertJsonPath('data.saved_at', null);
});

it('lets an active player save the pot and some positions, and shows who saved', function () {
    Carbon::setTestNow('2025-03-14 22:10:00');

    ($this->save)($this->anaUser, [6 => $this->breno], '840.00')
        ->assertOk()
        ->assertJsonPath('data.pot', '840.00')
        ->assertJsonPath('data.main_event_pot', null)
        ->assertJsonPath('data.positions', fn (array $lines) => count($lines) === 1)
        ->assertJsonPath('data.positions.0.position', 6)
        ->assertJsonPath('data.positions.0.player.nickname', 'Breno')
        ->assertJsonPath('data.saved_by.name', 'Ana');

    $this->getJson($this->url)->assertOk()->assertJsonPath('data.saved_at', Carbon::now()->toIso8601String());
    // It gives no points and leaves the night open.
    expect($this->night->fresh()->status)->toBe('open')
        ->and($this->night->results()->count())->toBe(0);
});

it('replaces the whole partial result on the next save: the last save wins', function () {
    ($this->save)($this->anaUser, [6 => $this->breno], '840.00', '170.00', '20.00')->assertOk();

    ($this->save)($this->carlaUser, [5 => $this->dudu, 6 => $this->breno], '840.00')
        ->assertOk()
        ->assertJsonPath('data.main_event_pot', null)
        ->assertJsonPath('data.time_chip', null)
        ->assertJsonPath('data.positions.0.player.nickname', 'Dudu')
        ->assertJsonPath('data.positions.1.player.nickname', 'Breno')
        ->assertJsonPath('data.saved_by.name', 'Carla');

    ($this->save)($this->anaUser)->assertOk()->assertJsonPath('data.pot', null)->assertJsonPath('data.positions', []);
    expect(NightPartialResult::query()->count())->toBe(1);
});

it('refuses the same player twice and says where', function () {
    ($this->save)($this->carlaUser, [4 => $this->dudu, 5 => $this->dudu])
        ->assertUnprocessable()
        ->assertJsonPath('rule', 'night.result.duplicate_player')
        ->assertJsonPath('errors', ['positions.5' => ['Este jogador já está na 4ª posição.']]);
});

it('refuses a position that does not score, and an archived or unknown player', function () {
    ($this->save)($this->anaUser, [7 => $this->breno])->assertUnprocessable()->assertJsonPath('rule', 'night.result.too_many_positions');

    $archived = Player::factory()->archived()->create();
    ($this->save)($this->anaUser, [1 => $archived])->assertUnprocessable()->assertJsonPath('rule', 'night.result.unknown_player');

    Sanctum::actingAs($this->anaUser);
    $this->putJson($this->url, ['pot' => null, 'main_event_pot' => null, 'time_chip' => null, 'positions' => [['position' => 1, 'player_id' => 999999]]])
        ->assertUnprocessable()
        ->assertJsonPath('rule', 'night.result.unknown_player');

    expect(NightPartialResult::query()->count())->toBe(0);
});

it('refuses a partial result on a scheduled or finished night', function (string $status) {
    $this->night->update(['status' => $status]);

    ($this->save)($this->anaUser, [], '840.00')
        ->assertConflict()
        ->assertJsonPath('rule', 'night.partial_result.not_open')
        ->assertJsonPath('message', 'O resultado parcial só pode ser preenchido enquanto o evento está aberto.');
})->with(['scheduled', 'finished']);

it('does not let an inactive player, an archived player or an account with no player save', function () {
    $inactive = User::factory()->create(['player_id' => Player::factory()->inactive()->create()->id]);
    $archived = User::factory()->create(['player_id' => Player::factory()->archived()->create()->id]);
    $noPlayer = User::factory()->create();

    foreach ([$inactive, $archived, $noPlayer] as $user) {
        ($this->save)($user, [], '840.00')->assertForbidden();
        // They still see it.
        $this->getJson($this->url)->assertOk();
    }
});

it('lets a results keeper with no player save', function () {
    $keeper = User::factory()->resultsKeeper()->create(['name' => 'Maria']);

    ($this->save)($keeper, [1 => $this->ana], '840.00')->assertOk()->assertJsonPath('data.saved_by.name', 'Maria');
});

it('deletes the partial result when the night is finished', function () {
    ($this->save)($this->carlaUser, [5 => $this->dudu, 6 => $this->breno], '840.00')->assertOk();

    $others = Player::factory()->count(2)->create();
    $order = [$this->ana, $this->carla, $others[0], $others[1], $this->dudu, $this->breno];
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());
    $this->postJson("/api/v1/nights/{$this->night->id}/finish", [
        'pot' => '840.00',
        'main_event_pot' => '0',
        'time_chip' => '0',
        'positions' => array_map(fn (Player $p, int $i) => ['position' => $i + 1, 'player_id' => $p->id], $order, array_keys($order)),
    ])->assertOk()->assertJsonPath('data.status', 'finished');

    expect(NightPartialResult::query()->count())->toBe(0);
    $this->getJson($this->url)->assertOk()->assertJsonPath('data.pot', null)->assertJsonPath('data.positions', []);
});

it('does not audit partial result saves, whoever makes them', function () {
    ($this->save)($this->anaUser, [], '840.00')->assertOk();
    ($this->save)(User::factory()->admin()->create(), [], '850.00')->assertOk();

    expect(AuditLog::query()->count())->toBe(0);
});

it('tells the client who may save partial results', function (Closure $user, bool $allowed) {
    Sanctum::actingAs($user());

    $this->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.abilities.save_partial_results', $allowed);
})->with([
    'active player' => [fn () => User::factory()->create(['player_id' => Player::factory()->create()->id]), true],
    'inactive player' => [fn () => User::factory()->create(['player_id' => Player::factory()->inactive()->create()->id]), false],
    'account with no player' => [fn () => User::factory()->create(), false],
    'results keeper with no player' => [fn () => User::factory()->resultsKeeper()->create(), true],
]);
