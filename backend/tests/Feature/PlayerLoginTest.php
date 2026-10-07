<?php

/*
 * Site access on the player's admin screen, following docs/specs/accounts-and-roles.md.
 */

use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use PTSite\App\Models\AuditLog;
use PTSite\App\Models\Player;
use PTSite\App\Models\User;

it('gives a quick-added player a login, named after the nickname', function () {
    $admin = User::factory()->admin()->create();
    $carlao = Player::factory()->create(['nickname' => 'Carlão', 'name' => null]);
    Sanctum::actingAs($admin);

    $this->putJson("/api/v1/players/{$carlao->id}/login", ['username' => 'carlao', 'password' => 'mesa-verde-7', 'role' => 'player'])
        ->assertOk()
        ->assertJsonPath('data.login.username', 'carlao')
        ->assertJsonPath('data.login.role', 'player');

    $login = User::query()->where('username', 'carlao')->sole();
    expect($login->player_id)->toBe($carlao->id)
        ->and($login->name)->toBe('Carlão')
        ->and(Hash::check('mesa-verde-7', $login->password))->toBeTrue();
});

it('makes Maria a results keeper', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $maria = Player::factory()->create(['nickname' => 'Maria']);
    User::factory()->create(['username' => 'maria', 'player_id' => $maria->id]);

    $this->putJson("/api/v1/players/{$maria->id}/login", ['role' => 'results_keeper'])
        ->assertOk()
        ->assertJsonPath('data.login.role', 'results_keeper');
    expect(User::query()->where('username', 'maria')->sole()->canRunNights())->toBeTrue();
});

it('sets a new password, which replaces an imported password', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $player = Player::factory()->create();
    $login = User::factory()->legacy('antiga')->create(['username' => 'ana', 'player_id' => $player->id]);

    $this->putJson("/api/v1/players/{$player->id}/login", ['password' => 'nova-senha-9'])->assertOk();

    $login->refresh();
    expect($login->legacy_password)->toBeNull()
        ->and(Hash::check('nova-senha-9', $login->password))->toBeTrue();
});

it('refuses an admin changing their own role', function () {
    $player = Player::factory()->create();
    $admin = User::factory()->admin()->create(['player_id' => $player->id]);
    Sanctum::actingAs($admin);

    $this->putJson("/api/v1/players/{$player->id}/login", ['role' => 'player'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.role.0', 'Você não pode mudar o seu próprio papel.');
    expect($admin->refresh()->isAdmin())->toBeTrue();
});

it('refuses a username that is taken, ignoring capitals', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    User::factory()->create(['username' => 'breno']);
    $player = Player::factory()->create();

    $this->putJson("/api/v1/players/{$player->id}/login", ['username' => 'Breno', 'password' => 'mesa-verde-7'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.username.0', 'Já existe um acesso com este usuário.');
});

it('needs a username and password to create a login', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $player = Player::factory()->create();

    $this->putJson("/api/v1/players/{$player->id}/login", ['username' => 'novo'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.password.0', 'Informe a senha para criar o acesso.');
});

it('lets only admins manage site access', function () {
    $player = Player::factory()->create();
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());

    $this->putJson("/api/v1/players/{$player->id}/login", ['username' => 'x', 'password' => 'mesa-verde-7'])->assertForbidden();
});

it('records the change in the audit log without the password', function () {
    $admin = User::factory()->admin()->create();
    Sanctum::actingAs($admin);
    $player = Player::factory()->create();

    $this->putJson("/api/v1/players/{$player->id}/login", ['username' => 'jose', 'password' => 'mesa-verde-7'])->assertOk();

    $entry = AuditLog::query()->where('action', 'login.created')->sole();
    expect($entry->user_id)->toBe($admin->id)
        ->and(json_encode($entry->after))->not->toContain('mesa-verde-7')
        ->and($entry->after['password_changed'])->toBeTrue();
});

it('shows a player\'s login to admins only', function () {
    $player = Player::factory()->create(['nickname' => 'Ana']);
    User::factory()->create(['username' => 'ana', 'player_id' => $player->id]);

    Sanctum::actingAs(User::factory()->create());
    $this->getJson("/api/v1/players/{$player->id}")->assertOk()->assertJsonMissingPath('data.login');

    Sanctum::actingAs(User::factory()->admin()->create());
    $this->getJson('/api/v1/players?search=Ana')->assertOk()->assertJsonPath('data.0.login.username', 'ana');
});
