<?php

/*
 * The night dashboard through the API, following the examples in docs/specs/night-dashboard.md.
 */

use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use PTSite\App\Models\AuditLog;
use PTSite\App\Models\Night;
use PTSite\App\Models\NightAttendance;
use PTSite\App\Models\NightPlayer;
use PTSite\App\Models\NightRebuy;
use PTSite\App\Models\Player;
use PTSite\App\Models\Season;
use PTSite\App\Models\User;

beforeEach(function () {
    config(['ptsite.features' => ['nightDashboard' => true, 'houseOwnerBuyIn' => true]]);
    $this->season = Season::factory()->create(['allows_extra_rebuys' => true, 'house_owner_buy_in' => '25.00', 'main_event_pot_percent' => 20]);
    $this->night = Night::factory()->for($this->season)->open()->create(['starts_at' => '2025-03-14 21:30:00']);
    foreach (['ana' => 'Ana', 'breno' => 'Breno', 'carla' => 'Carla', 'dudu' => 'Dudu', 'elio' => 'Élio'] as $key => $nickname) {
        $this->{$key} = Player::factory()->create(['nickname' => $nickname]);
        $this->{"{$key}User"} = User::factory()->create(['player_id' => $this->{$key}->id, 'name' => $nickname]);
    }
    $this->admin = User::factory()->admin()->create(['name' => 'Helena']);
    $this->keeper = User::factory()->resultsKeeper()->create(['name' => 'Maria']);
    $this->url = "/api/v1/nights/{$this->night->id}/dashboard";
    Sanctum::actingAs($this->anaUser);

    $this->mark = fn (Player $player, array $marks = []): TestResponse => $this->patchJson("{$this->url}/players/{$player->id}", $marks);
    /** Adds one rebuy and answers its id. */
    $this->rebuy = function (Player $player, bool $paid = false): int {
        $has = NightRebuy::query()->where('night_id', $this->night->id)->where('player_id', $player->id)->count();
        $this->postJson("{$this->url}/players/{$player->id}/rebuys", ['count' => $has])->assertOk();
        $id = NightRebuy::query()->where('player_id', $player->id)->latest('id')->value('id');
        if ($paid) {
            $this->patchJson("{$this->url}/rebuys/{$id}", ['paid' => true])->assertOk();
        }

        return $id;
    };
    /** The night of the examples, at Élio's house. */
    $this->play = function (): void {
        ($this->mark)($this->ana, ['buy_in_paid' => true])->assertOk();
        ($this->mark)($this->breno, ['buy_in_paid' => true])->assertOk();
        ($this->mark)($this->elio, ['buy_in_paid' => true])->assertOk();
        $this->putJson("{$this->url}/house-owner", ['player_id' => $this->elio->id])->assertOk();
        ($this->rebuy)($this->ana, paid: true);
        ($this->rebuy)($this->breno, paid: true);
        ($this->rebuy)($this->breno, paid: true);
        ($this->rebuy)($this->breno);
        ($this->mark)($this->carla, ['time_chip_paid' => true])->assertOk();
        ($this->mark)($this->dudu)->assertOk();
    };
    $this->finish = function (string $pot = '425.00'): TestResponse {
        $others = Player::factory()->count(1)->create();
        $order = [$this->ana, $this->breno, $this->carla, $this->dudu, $this->elio, $others[0]];
        Sanctum::actingAs($this->keeper);

        return $this->postJson("/api/v1/nights/{$this->night->id}/finish", [
            'pot' => $pot,
            'main_event_pot' => '85.00',
            'time_chip' => '25.00',
            'positions' => array_map(fn (Player $p, int $i) => ['position' => $i + 1, 'player_id' => $p->id], $order, array_keys($order)),
        ]);
    };
});

it('works out the pot and the time chip of a night from what its players bought and paid', function () {
    ($this->play)();

    $this->getJson($this->url)
        ->assertOk()
        ->assertJsonPath('data.status', 'open')
        ->assertJsonPath('data.can_edit', true)
        ->assertJsonPath('data.totals.pot', ['owed' => '425.00', 'paid' => '275.00', 'pending' => '150.00'])
        ->assertJsonPath('data.totals.time_chip', ['owed' => '25.00', 'paid' => '20.00', 'pending' => '5.00'])
        ->assertJsonPath('data.totals.total', ['owed' => '450.00', 'paid' => '295.00', 'pending' => '155.00'])
        ->assertJsonPath('data.suggested_main_event_pot', '85.00')
        ->assertJsonPath('data.house_owner.nickname', 'Élio')
        ->assertJsonPath('data.prices.buy_in', '50.00')
        ->assertJsonPath('data.prices.fixed', false)
        ->assertJsonPath('data.recorded', null)
        // By name, whatever the order they were added in.
        ->assertJsonPath('data.players.*.player.nickname', ['Ana', 'Breno', 'Carla', 'Dudu', 'Élio'])
        ->assertJsonPath('data.players.1.owed', '215.00')
        ->assertJsonPath('data.players.1.pending', '55.00')
        ->assertJsonPath('data.players.1.rebuys.*.paid', [true, true, false])
        ->assertJsonPath('data.players.2.time_chip', true)
        ->assertJsonPath('data.players.2.time_chip_paid', true)
        ->assertJsonPath('data.players.3.buy_in_paid', false)
        ->assertJsonPath('data.players.4.is_house_owner', true)
        ->assertJsonPath('data.players.4.buy_in', '25.00');
});

it('charges the owner of the house the buy-in on a site without the house owner\'s buy-in', function () {
    config(['ptsite.features' => ['nightDashboard' => true, 'houseOwnerBuyIn' => false]]);
    ($this->play)();

    $this->getJson($this->url)
        ->assertJsonPath('data.players.4.buy_in', '50.00')
        ->assertJsonPath('data.totals.pot.owed', '450.00');
});

it('has no time chip on a site without the time chip', function () {
    config(['ptsite.features' => ['nightDashboard' => true, 'timeChip' => false]]);

    ($this->mark)($this->carla, ['time_chip' => true])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['time_chip']);
    ($this->mark)($this->carla, ['buy_in_paid' => true])
        ->assertOk()
        ->assertJsonPath('data.totals.time_chip', null)
        ->assertJsonPath('data.totals.total.owed', '50.00');
});

it('has no dashboard on a site without the feature', function () {
    config(['ptsite.features' => ['nightDashboard' => false]]);

    $this->getJson($this->url)->assertNotFound();
    ($this->mark)($this->ana, ['buy_in_paid' => true])->assertNotFound();
    expect(NightPlayer::query()->count())->toBe(0);
});

it('makes a player a participant, and confirms them, on any action', function () {
    ($this->mark)($this->dudu, ['buy_in_paid' => true])
        ->assertOk()
        ->assertJsonPath('data.players.0.player.nickname', 'Dudu')
        ->assertJsonPath('data.players.0.buy_in_paid', true);

    $answer = NightAttendance::query()->where('player_id', $this->dudu->id)->sole();
    expect($answer->answer)->toBe('all_in')
        ->and($answer->answered_by_user_id)->toBe($this->anaUser->id)
        ->and(AuditLog::query()->where('action', 'attendance.set_for_player')->count())->toBe(1);
});

it('confirms a player with no mark, and changes a FOLD to ALL IN', function () {
    Sanctum::actingAs($this->carlaUser);
    $this->putJson("/api/v1/nights/{$this->night->id}/attendance/{$this->carla->id}", ['answer' => 'fold'])->assertOk();

    Sanctum::actingAs($this->anaUser);
    ($this->mark)($this->carla)->assertOk()->assertJsonPath('data.players.0.player.nickname', 'Carla');
    expect(NightAttendance::query()->where('player_id', $this->carla->id)->value('answer'))->toBe('all_in');
});

it('lists the players who answered ALL IN as participants who owe a buy-in', function () {
    Sanctum::actingAs($this->carlaUser);
    $this->putJson("/api/v1/nights/{$this->night->id}/attendance/{$this->carla->id}", ['answer' => 'all_in'])->assertOk();

    $this->getJson($this->url)
        ->assertJsonPath('data.players.0.player.nickname', 'Carla')
        ->assertJsonPath('data.totals.pot', ['owed' => '50.00', 'paid' => '0.00', 'pending' => '50.00']);
    expect(NightPlayer::query()->count())->toBe(0);
});

it('marks a time chip that is paid as owed, and one that is not owed as not paid', function () {
    ($this->mark)($this->carla, ['time_chip_paid' => true])
        ->assertJsonPath('data.players.0.time_chip', true)
        ->assertJsonPath('data.players.0.time_chip_paid', true);
    ($this->mark)($this->carla, ['time_chip_paid' => false])
        ->assertJsonPath('data.players.0.time_chip', true)
        ->assertJsonPath('data.players.0.time_chip_paid', false);
    ($this->mark)($this->carla, ['time_chip_paid' => true])->assertOk();
    ($this->mark)($this->carla, ['time_chip' => false])
        ->assertJsonPath('data.players.0.time_chip', false)
        ->assertJsonPath('data.players.0.time_chip_paid', false)
        ->assertJsonPath('data.totals.time_chip.owed', '0.00');
});

it('keeps the date of a mark that is set again', function () {
    ($this->mark)($this->ana, ['buy_in_paid' => true])->assertOk();
    $paidAt = NightPlayer::query()->sole()->buy_in_paid_at;
    $this->travel(5)->minutes();

    ($this->mark)($this->ana, ['buy_in_paid' => true])->assertOk();

    expect(NightPlayer::query()->sole()->buy_in_paid_at->equalTo($paidAt))->toBeTrue();
});

it('lets active players, results keepers and admins change an open night, and everyone see it', function () {
    $inactive = User::factory()->create(['player_id' => Player::factory()->inactive()->create()->id]);
    $noPlayer = User::factory()->create();

    foreach ([$inactive, $noPlayer] as $user) {
        Sanctum::actingAs($user);
        ($this->mark)($this->ana, ['buy_in_paid' => true])->assertForbidden();
        $this->getJson($this->url)->assertOk()->assertJsonPath('data.can_edit', false);
    }
    foreach ([$this->brenoUser, $this->keeper, $this->admin] as $user) {
        Sanctum::actingAs($user);
        ($this->mark)($this->ana, ['buy_in_paid' => true])->assertOk()->assertJsonPath('data.can_edit', true);
    }
});

it('lets only admins change a finished night, and audits it', function () {
    ($this->play)();
    $unpaid = NightRebuy::query()->where('player_id', $this->breno->id)->whereNull('paid_at')->value('id');
    ($this->finish)()->assertOk();
    $points = $this->night->results()->pluck('points', 'position')->all();
    AuditLog::query()->delete();

    foreach ([$this->elioUser, $this->keeper] as $user) {
        Sanctum::actingAs($user);
        $this->patchJson("{$this->url}/rebuys/{$unpaid}", ['paid' => true])->assertForbidden();
        $this->getJson($this->url)->assertOk()->assertJsonPath('data.can_edit', false);
    }

    Sanctum::actingAs($this->admin);
    $this->patchJson("{$this->url}/rebuys/{$unpaid}", ['paid' => true])
        ->assertOk()
        ->assertJsonPath('data.can_edit', true)
        ->assertJsonPath('data.totals.total', ['owed' => '450.00', 'paid' => '350.00', 'pending' => '100.00'])
        // What the keeper finished the night with stays.
        ->assertJsonPath('data.recorded', ['pot' => '425.00', 'main_event_pot' => '85.00', 'time_chip' => '25.00']);

    $log = AuditLog::query()->sole();
    expect($log->action)->toBe('night.payments_changed')
        ->and($log->user_id)->toBe($this->admin->id)
        ->and($log->before['rebuys_paid'])->toBe([true, true, false])
        ->and($log->after['rebuys_paid'])->toBe([true, true, true])
        ->and($this->night->fresh()->pot)->toBe('425.00')
        ->and($this->night->results()->pluck('points', 'position')->all())->toBe($points);
});

it('splits what was paid into cash and not in cash', function () {
    ($this->play)();
    $this->getJson($this->url)
        ->assertJsonPath('data.received', ['cash' => '295.00', 'non_cash' => '0.00', 'non_cash_marked' => '0.00', 'non_cash_adjustment' => null]);

    $anasRebuy = NightRebuy::query()->where('player_id', $this->ana->id)->value('id');
    $this->patchJson("{$this->url}/rebuys/{$anasRebuy}", ['paid' => true, 'non_cash' => true])->assertOk();
    ($this->mark)($this->breno, ['buy_in_paid' => true, 'buy_in_non_cash' => true])
        ->assertOk()
        ->assertJsonPath('data.players.0.rebuys.0', ['id' => $anasRebuy, 'paid' => true, 'non_cash' => true])
        ->assertJsonPath('data.players.0.buy_in_non_cash', false)
        ->assertJsonPath('data.players.1.buy_in_non_cash', true)
        ->assertJsonPath('data.players.1.rebuys.*.non_cash', [false, false, false])
        ->assertJsonPath('data.players.*.non_cash', ['55.00', '50.00', '0.00', '0.00', '0.00'])
        // The pot and the time chip do not change.
        ->assertJsonPath('data.totals.total', ['owed' => '450.00', 'paid' => '295.00', 'pending' => '155.00'])
        ->assertJsonPath('data.received', ['cash' => '190.00', 'non_cash' => '105.00', 'non_cash_marked' => '105.00', 'non_cash_adjustment' => null]);
});

it('counts a time chip as paid the way the buy-in was', function () {
    ($this->mark)($this->carla, ['buy_in_non_cash' => true, 'time_chip_paid' => true])
        ->assertOk()
        ->assertJsonPath('data.received.non_cash', '55.00')
        ->assertJsonPath('data.received.cash', '0.00');
    ($this->mark)($this->carla, ['buy_in_non_cash' => false])
        ->assertJsonPath('data.players.0.buy_in_paid', true)
        ->assertJsonPath('data.received.non_cash', '0.00')
        ->assertJsonPath('data.received.cash', '55.00');
});

it('marks a payment that was not in cash as paid, and one that is not paid as paid in no way', function () {
    ($this->mark)($this->ana, ['buy_in_non_cash' => true])
        ->assertJsonPath('data.players.0.buy_in_paid', true)
        ->assertJsonPath('data.players.0.buy_in_non_cash', true);
    // A mark that is left out stays.
    ($this->mark)($this->ana, ['buy_in_paid' => true])->assertJsonPath('data.players.0.buy_in_non_cash', true);
    ($this->mark)($this->ana, ['buy_in_paid' => false])
        ->assertJsonPath('data.players.0.buy_in_paid', false)
        ->assertJsonPath('data.players.0.buy_in_non_cash', false);
    ($this->mark)($this->ana, ['buy_in_paid' => true])->assertJsonPath('data.players.0.buy_in_non_cash', false);

    $rebuy = ($this->rebuy)($this->ana);
    $this->patchJson("{$this->url}/rebuys/{$rebuy}", ['paid' => false, 'non_cash' => true])
        ->assertJsonPath('data.players.0.rebuys.0', ['id' => $rebuy, 'paid' => true, 'non_cash' => true]);
    $this->patchJson("{$this->url}/rebuys/{$rebuy}", ['paid' => true])->assertJsonPath('data.players.0.rebuys.0.non_cash', true);
    $this->patchJson("{$this->url}/rebuys/{$rebuy}", ['paid' => false])->assertJsonPath('data.players.0.rebuys.0.non_cash', false);
    $this->patchJson("{$this->url}/rebuys/{$rebuy}", ['paid' => true])->assertJsonPath('data.players.0.rebuys.0.non_cash', false);
});

it('adds an amount typed by hand to what was paid not in cash, also a negative one', function () {
    ($this->play)();
    ($this->mark)($this->breno, ['buy_in_non_cash' => true])->assertOk();

    $this->putJson("{$this->url}/non-cash-adjustment", ['amount' => '-5.00'])
        ->assertOk()
        ->assertJsonPath('data.received', ['cash' => '250.00', 'non_cash' => '45.00', 'non_cash_marked' => '50.00', 'non_cash_adjustment' => '-5.00']);
    $this->putJson("{$this->url}/non-cash-adjustment", ['amount' => '20'])
        ->assertJsonPath('data.received.non_cash', '70.00')
        ->assertJsonPath('data.received.cash', '225.00');

    foreach (['abc', '1.234', '--5'] as $wrong) {
        $this->putJson("{$this->url}/non-cash-adjustment", ['amount' => $wrong])->assertUnprocessable();
    }
    $this->putJson("{$this->url}/non-cash-adjustment", [])->assertUnprocessable();

    // It stays when the night is finished.
    ($this->finish)()->assertOk();
    $this->getJson($this->url)->assertJsonPath('data.received.non_cash_adjustment', '20.00');
    Sanctum::actingAs($this->elioUser);
    $this->putJson("{$this->url}/non-cash-adjustment", ['amount' => null])->assertForbidden();
    Sanctum::actingAs($this->admin);
    $this->putJson("{$this->url}/non-cash-adjustment", ['amount' => null])
        ->assertOk()
        ->assertJsonPath('data.received', ['cash' => '245.00', 'non_cash' => '50.00', 'non_cash_marked' => '50.00', 'non_cash_adjustment' => null]);
});

it('audits how a payment of a finished night was made', function () {
    ($this->play)();
    ($this->finish)()->assertOk();
    AuditLog::query()->delete();

    Sanctum::actingAs($this->admin);
    ($this->mark)($this->breno, ['buy_in_non_cash' => true])->assertOk();

    $log = AuditLog::query()->sole();
    expect($log->action)->toBe('night.payments_changed')
        ->and($log->before['buy_in_non_cash'])->toBeFalse()
        ->and($log->after['buy_in_non_cash'])->toBeTrue()
        ->and($log->after['rebuys_non_cash'])->toBe([false, false, false]);
});

it('does not audit the taps on an open night', function () {
    ($this->mark)($this->ana, ['buy_in_paid' => true])->assertOk();
    ($this->rebuy)($this->ana, paid: true);

    expect(AuditLog::query()->count())->toBe(0)
        ->and(NightPlayer::query()->sole()->updated_by_user_id)->toBe($this->anaUser->id)
        ->and(NightRebuy::query()->sole()->created_by_user_id)->toBe($this->anaUser->id);
});

it('has no dashboard for a scheduled night or a Main Event night', function (array $state, string $rule, string $message) {
    $this->night->update($state);

    $this->getJson($this->url)->assertConflict()->assertJsonPath('rule', $rule)->assertJsonPath('message', $message);
    ($this->mark)($this->ana, ['buy_in_paid' => true])->assertConflict()->assertJsonPath('rule', $rule);
})->with([
    'scheduled' => [['status' => 'scheduled'], 'night.dashboard.not_open', 'O painel começa quando o evento for aberto.'],
    'a Main Event' => [['type' => 'main_event'], 'night.dashboard.main_event_night', 'Um Main Event não tem painel.'],
]);

it('adds one rebuy when two people record the same one', function () {
    ($this->rebuy)($this->breno);
    $add = fn () => $this->postJson("{$this->url}/players/{$this->breno->id}/rebuys", ['count' => 1])->assertOk();

    $add()->assertJsonPath('data.players.0.rebuys', fn (array $rebuys) => count($rebuys) === 2);
    // The second tap saw one rebuy too: the rebuy it asks for is already there.
    $add()->assertJsonPath('data.players.0.rebuys', fn (array $rebuys) => count($rebuys) === 2);
});

it('follows the rebuys of the season', function () {
    $this->season->update(['allows_extra_rebuys' => false]);
    ($this->rebuy)($this->breno);
    ($this->rebuy)($this->breno);

    $this->postJson("{$this->url}/players/{$this->breno->id}/rebuys", ['count' => 2])
        ->assertUnprocessable()
        ->assertJsonPath('rule', 'night.money.rebuy_limit')
        ->assertJsonPath('message', 'O limite é de 2 rebuys por jogador.');

    $this->season->update(['rebuys_allowed' => 0]);
    $this->postJson("{$this->url}/players/{$this->ana->id}/rebuys", ['count' => 0])
        ->assertUnprocessable()
        ->assertJsonPath('message', 'Esta temporada não tem rebuys.');
    // A refused rebuy does not make the player a participant.
    expect(NightPlayer::query()->where('player_id', $this->ana->id)->exists())->toBeFalse();
});

it('removes a rebuy, and does not find a rebuy of another night', function () {
    $id = ($this->rebuy)($this->breno);
    $other = Night::factory()->for($this->season)->create(['status' => 'finished']);

    $this->patchJson("/api/v1/nights/{$other->id}/dashboard/rebuys/{$id}", ['paid' => true])->assertNotFound();
    $this->deleteJson("{$this->url}/rebuys/{$id}")->assertOk()->assertJsonPath('data.players.0.rebuys', []);
});

it('keeps a participant with a mark or a rebuy on the night', function () {
    ($this->mark)($this->carla)->assertOk();
    ($this->mark)($this->dudu, ['buy_in_paid' => true])->assertOk();

    // Carla has no marks: she can fold, and leaves the dashboard.
    Sanctum::actingAs($this->carlaUser);
    $this->putJson("/api/v1/nights/{$this->night->id}/attendance/{$this->carla->id}", ['answer' => 'fold'])->assertOk();
    expect(NightPlayer::query()->where('player_id', $this->carla->id)->exists())->toBeFalse();

    Sanctum::actingAs($this->duduUser);
    $this->putJson("/api/v1/nights/{$this->night->id}/attendance/{$this->dudu->id}", ['answer' => 'fold'])
        ->assertUnprocessable()
        ->assertJsonPath('rule', 'night.money.has_payments')
        ->assertJsonPath('message', 'Remova os pagamentos e os rebuys do jogador antes.');
    $this->deleteJson("/api/v1/nights/{$this->night->id}/attendance/{$this->dudu->id}")->assertUnprocessable();
    $this->deleteJson("{$this->url}/players/{$this->dudu->id}")->assertUnprocessable()->assertJsonPath('rule', 'night.money.has_payments');

    ($this->mark)($this->dudu, ['buy_in_paid' => false])->assertOk();
    $this->deleteJson("{$this->url}/players/{$this->dudu->id}")->assertOk()->assertJsonPath('data.players', []);
    expect(NightAttendance::query()->where('player_id', $this->dudu->id)->exists())->toBeFalse();
});

it('makes the owner of the house a participant, and audits the change', function () {
    $this->putJson("{$this->url}/house-owner", ['player_id' => $this->elio->id])
        ->assertOk()
        ->assertJsonPath('data.house_owner.nickname', 'Élio')
        ->assertJsonPath('data.players.0.is_house_owner', true)
        ->assertJsonPath('data.players.0.buy_in', '25.00');
    expect(NightAttendance::query()->where('player_id', $this->elio->id)->value('answer'))->toBe('all_in');

    $log = AuditLog::query()->where('action', 'night.house_owner_changed')->sole();
    expect($log->before)->toBe(['house_owner_player_id' => null])
        ->and($log->after)->toBe(['house_owner_player_id' => $this->elio->id]);

    $this->putJson("{$this->url}/house-owner", ['player_id' => null])
        ->assertOk()
        ->assertJsonPath('data.house_owner', null)
        ->assertJsonPath('data.players.0.buy_in', '50.00');
});

it('has no house owner once the owner leaves the night', function () {
    $this->putJson("{$this->url}/house-owner", ['player_id' => $this->elio->id])->assertOk();

    $this->deleteJson("{$this->url}/players/{$this->elio->id}")->assertOk()->assertJsonPath('data.house_owner', null);
    expect($this->night->fresh()->house_owner_player_id)->toBeNull();
});

it('saves one position at a time, so two people do not undo each other', function () {
    $this->putJson("{$this->url}/positions/6", ['player_id' => $this->breno->id])->assertOk();
    Sanctum::actingAs($this->carlaUser);
    $this->putJson("{$this->url}/positions/5", ['player_id' => $this->dudu->id])
        ->assertOk()
        ->assertJsonPath('data.positions.*.position', [5, 6])
        ->assertJsonPath('data.positions.*.player.nickname', ['Dudu', 'Breno']);

    $this->putJson("{$this->url}/positions/4", ['player_id' => $this->dudu->id])
        ->assertUnprocessable()
        ->assertJsonPath('rule', 'night.result.duplicate_player')
        ->assertJsonPath('errors', ['player_id' => ['Este jogador já está na 5ª posição.']]);
    $this->putJson("{$this->url}/positions/7", ['player_id' => $this->ana->id])->assertUnprocessable()->assertJsonPath('rule', 'night.result.too_many_positions');

    $this->putJson("{$this->url}/positions/5", ['player_id' => null])->assertOk()->assertJsonPath('data.positions.*.position', [6]);
    // The partial result of the night's page shows the same positions.
    $this->getJson("/api/v1/nights/{$this->night->id}/partial-result")
        ->assertJsonPath('data.positions.0.player.nickname', 'Breno')
        ->assertJsonPath('data.saved_by.name', 'Carla');
});

it('keeps a typed Main Event pot', function () {
    $this->putJson("{$this->url}/main-event-pot", ['amount' => '90'])->assertOk()->assertJsonPath('data.main_event_pot', '90.00');
    $this->putJson("{$this->url}/positions/6", ['player_id' => $this->breno->id])->assertOk()->assertJsonPath('data.main_event_pot', '90.00');

    $this->putJson("{$this->url}/main-event-pot", ['amount' => null])->assertOk()->assertJsonPath('data.main_event_pot', null);
});

it('takes a pot and a time chip typed by hand, and still works out its own', function () {
    ($this->play)();

    $this->getJson($this->url)->assertJsonPath('data.manual', ['pot' => null, 'time_chip' => null]);
    $this->putJson("{$this->url}/amounts", ['pot' => '600', 'time_chip' => '40.00'])
        ->assertOk()
        ->assertJsonPath('data.manual', ['pot' => '600.00', 'time_chip' => '40.00'])
        ->assertJsonPath('data.totals.pot.owed', '425.00')
        ->assertJsonPath('data.totals.time_chip.owed', '25.00')
        // 20% of the typed pot.
        ->assertJsonPath('data.suggested_main_event_pot', '120.00');
    // The positions and the Main Event pot do not touch them.
    $this->putJson("{$this->url}/positions/6", ['player_id' => $this->breno->id])->assertOk()->assertJsonPath('data.manual.pot', '600.00');
    $this->putJson("{$this->url}/main-event-pot", ['amount' => '100'])->assertOk()->assertJsonPath('data.manual.time_chip', '40.00');

    // Each amount is set by itself: the one left out stays.
    $this->putJson("{$this->url}/amounts", ['pot' => null])
        ->assertOk()
        ->assertJsonPath('data.manual', ['pot' => null, 'time_chip' => '40.00'])
        ->assertJsonPath('data.suggested_main_event_pot', '85.00');
    $this->putJson("{$this->url}/amounts", ['time_chip' => null])
        ->assertOk()
        ->assertJsonPath('data.manual', ['pot' => null, 'time_chip' => null])
        ->assertJsonPath('data.main_event_pot', '100.00')
        ->assertJsonPath('data.positions.0.player.nickname', 'Breno');

    $this->putJson("{$this->url}/amounts", ['pot' => '12,50'])->assertUnprocessable()->assertJsonValidationErrors(['pot']);
});

it('takes typed amounts only while the night is open, and from who changes the dashboard', function () {
    Sanctum::actingAs(User::factory()->create());
    $this->putJson("{$this->url}/amounts", ['pot' => '600', 'time_chip' => null])->assertForbidden();

    ($this->finish)()->assertOk();
    Sanctum::actingAs($this->admin);
    $this->putJson("{$this->url}/amounts", ['pot' => '600', 'time_chip' => null])->assertConflict()->assertJsonPath('rule', 'night.dashboard.finished');
    $this->getJson($this->url)->assertJsonPath('data.manual', ['pot' => null, 'time_chip' => null]);
});

it('keeps no typed time chip on a site without the time chip', function () {
    config(['ptsite.features' => ['nightDashboard' => true, 'timeChip' => false]]);

    $this->putJson("{$this->url}/amounts", ['pot' => '600', 'time_chip' => '40'])
        ->assertOk()
        ->assertJsonPath('data.manual', ['pot' => '600.00', 'time_chip' => null]);
});

it('fixes the participants and the prices when the night is finished', function () {
    ($this->play)();
    $late = Player::factory()->create(['nickname' => 'Fausto']);
    Sanctum::actingAs($this->keeper);
    $this->putJson("/api/v1/nights/{$this->night->id}/attendance/{$late->id}", ['answer' => 'all_in'])->assertOk();

    ($this->finish)('500.00')->assertOk();

    // Fausto only answered ALL IN: finishing gives him a record.
    expect(NightPlayer::query()->where('player_id', $late->id)->exists())->toBeTrue();
    Sanctum::actingAs($this->admin);
    $this->patchJson("/api/v1/seasons/{$this->season->id}", ['buy_in' => '60.00', 'rebuy_value' => '70.00'])->assertOk();

    $this->getJson($this->url)
        ->assertOk()
        ->assertJsonPath('data.status', 'finished')
        ->assertJsonPath('data.prices.fixed', true)
        ->assertJsonPath('data.prices.buy_in', '50.00')
        ->assertJsonPath('data.prices.rebuy_value', '50.00')
        ->assertJsonPath('data.totals.pot.owed', '475.00')
        ->assertJsonPath('data.recorded.pot', '500.00')
        ->assertJsonPath('data.positions', [])
        ->assertJsonPath('data.suggested_main_event_pot', null);

    $this->putJson("{$this->url}/positions/1", ['player_id' => $this->ana->id])->assertConflict()->assertJsonPath('rule', 'night.dashboard.finished');
});

it('lets an admin add a player to a finished night without an answer', function () {
    ($this->finish)()->assertOk();
    $late = Player::factory()->create(['nickname' => 'Fausto']);
    Sanctum::actingAs($this->admin);

    ($this->mark)($late, ['buy_in_paid' => true])->assertOk()->assertJsonPath('data.players.0.player.nickname', 'Fausto');

    expect(NightAttendance::query()->where('player_id', $late->id)->exists())->toBeFalse()
        ->and(AuditLog::query()->where('action', 'night.payments_changed')->sole()->after['buy_in_paid'])->toBeTrue();
});

it('does not take an archived player', function () {
    $archived = Player::factory()->archived()->create();

    ($this->mark)($archived, ['buy_in_paid' => true])->assertUnprocessable()->assertJsonPath('rule', 'attendance.archived_player');
});

it('lets whoever changes the dashboard answer for other players', function (array $features, Closure $user, bool $allowed) {
    config(['ptsite.features' => $features]);
    Sanctum::actingAs($user());

    $this->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.abilities.answer_for_others', $allowed);
    $this->putJson("/api/v1/nights/{$this->night->id}/attendance/{$this->dudu->id}", ['answer' => 'all_in'])
        ->assertStatus($allowed ? 200 : 403);
})->with([
    'an active player, with the dashboard' => [['nightDashboard' => true], fn () => User::factory()->create(['player_id' => Player::factory()->create()->id]), true],
    'an active player, without it' => [['nightDashboard' => false], fn () => User::factory()->create(['player_id' => Player::factory()->create()->id]), false],
    'an inactive player, with the dashboard' => [['nightDashboard' => true], fn () => User::factory()->create(['player_id' => Player::factory()->inactive()->create()->id]), false],
    'a results keeper, without it' => [['nightDashboard' => false], fn () => User::factory()->resultsKeeper()->create(), true],
]);
