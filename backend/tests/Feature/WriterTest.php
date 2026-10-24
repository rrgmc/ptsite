<?php

/*
 * The writer account, following docs/specs/accounts-and-roles.md, rule 13: a program that writes the players'
 * memos and the season recaps through the API, with a token and nothing else.
 */

use Laravel\Sanctum\Sanctum;
use PTSite\App\Enums\Role;
use PTSite\App\Models\AuditLog;
use PTSite\App\Models\Night;
use PTSite\App\Models\Player;
use PTSite\App\Models\Season;
use PTSite\App\Models\User;

it('makes a writer account and prints a token that works on the API', function () {
    $this->artisan('ptsite:writer-token', ['username' => 'cronista'])->assertSuccessful();

    $writer = User::query()->where('username', 'cronista')->sole();
    expect($writer->role)->toBe(Role::Writer)
        ->and($writer->password)->toBeNull()
        ->and($writer->player_id)->toBeNull()
        ->and($writer->tokens()->count())->toBe(1)
        ->and(AuditLog::query()->where('action', 'account.writer_created')->count())->toBe(1);
});

it('adds a token to the same account the next time, and with --replace deletes the older ones', function () {
    $this->artisan('ptsite:writer-token')->assertSuccessful();
    $this->artisan('ptsite:writer-token')->assertSuccessful();
    $writer = User::query()->where('username', 'writer')->sole();
    expect($writer->tokens()->count())->toBe(2);

    $this->artisan('ptsite:writer-token', ['--replace' => true])->assertSuccessful();
    expect($writer->tokens()->count())->toBe(1);
});

it('refuses a username that belongs to an account with another role', function () {
    User::factory()->admin()->create(['username' => 'cronista']);

    $this->artisan('ptsite:writer-token', ['username' => 'cronista'])
        ->expectsOutputToContain('não é um redator')
        ->assertFailed();
    expect(User::query()->where('username', 'cronista')->sole()->tokens()->count())->toBe(0);
});

it('lets an admin make a writer token through the API, and the token works', function () {
    $admin = User::factory()->admin()->create();
    Sanctum::actingAs($admin);

    $token = $this->postJson('/api/v1/writer-tokens', ['username' => 'cronista'])->assertCreated()
        ->assertJsonPath('user.role', 'writer')
        ->assertJsonPath('user.username', 'cronista')
        ->json('token');
    expect(AuditLog::query()->where('action', 'account.writer_token_created')->value('user_id'))->toBe($admin->id);

    $this->app['auth']->forgetGuards();
    $this->withToken($token)->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.username', 'cronista');
});

it('replaces the older tokens through the API when asked', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $this->postJson('/api/v1/writer-tokens')->assertCreated();
    $this->postJson('/api/v1/writer-tokens')->assertCreated();
    $writer = User::query()->where('username', 'writer')->sole();
    expect($writer->tokens()->count())->toBe(2);

    $this->postJson('/api/v1/writer-tokens', ['replace' => true])->assertCreated();
    expect($writer->tokens()->count())->toBe(1);
});

it('lets only admins make a writer token, and refuses a username of another role', function () {
    User::factory()->resultsKeeper()->create(['username' => 'maria']);

    foreach ([User::factory()->create(), User::factory()->resultsKeeper()->create(), User::factory()->writer()->create()] as $user) {
        Sanctum::actingAs($user);
        $this->postJson('/api/v1/writer-tokens')->assertForbidden();
    }

    Sanctum::actingAs(User::factory()->admin()->create());
    $this->postJson('/api/v1/writer-tokens', ['username' => 'maria'])
        ->assertJsonPath('errors.username.0', 'Este usuário já existe e não é um redator.');
});

it('cannot log in with a password', function () {
    User::factory()->writer()->create(['username' => 'cronista']);

    $this->postJson('/api/v1/tokens', ['username' => 'cronista', 'password' => '', 'device_name' => 'x'])->assertUnprocessable();
    $this->postJson('/api/v1/tokens', ['username' => 'cronista', 'password' => 'password', 'device_name' => 'x'])->assertUnprocessable();
});

it('writes a memo, and the audit log records it', function () {
    $ana = Player::factory()->create(['nickname' => 'Ana']);
    Sanctum::actingAs(User::factory()->writer()->create());

    $this->patchJson("/api/v1/players/{$ana->id}", ['memo' => 'Rainha do river.'])->assertOk()
        ->assertJsonPath('data.memo', 'Rainha do river.');
    expect(AuditLog::query()->where('action', 'player.updated')->count())->toBe(1);
});

it('changes nothing else about a player', function () {
    $ana = Player::factory()->create(['nickname' => 'Ana']);
    Sanctum::actingAs(User::factory()->writer()->create());

    $this->patchJson("/api/v1/players/{$ana->id}", ['nickname' => 'Aninha'])->assertForbidden();
    $this->patchJson("/api/v1/players/{$ana->id}", ['memo' => 'x', 'nickname' => 'Aninha'])->assertForbidden();
    $this->patchJson("/api/v1/players/{$ana->id}", ['status' => 'inactive'])->assertForbidden();
    $this->postJson('/api/v1/players', ['nickname' => 'Novo'])->assertForbidden();
    $this->putJson("/api/v1/players/{$ana->id}/login", ['username' => 'ana', 'password' => 'segredo-123'])->assertForbidden();
});

it('runs no night and changes no season', function () {
    $season = Season::factory()->create();
    $night = Night::factory()->for($season)->create();
    Sanctum::actingAs(User::factory()->writer()->create());

    $this->postJson("/api/v1/nights/{$night->id}/open")->assertForbidden();
    $this->patchJson("/api/v1/seasons/{$season->id}", ['name' => 'Outra'])->assertForbidden();
    $this->getJson('/api/v1/audit-log')->assertForbidden();
});

it('reads the standings like any member, and says it writes texts', function () {
    $season = Season::factory()->create();
    Sanctum::actingAs(User::factory()->writer()->create());

    $this->getJson("/api/v1/seasons/{$season->id}/standings")->assertOk();
    $this->getJson('/api/v1/me')->assertOk()
        ->assertJsonPath('data.role', 'writer')
        ->assertJsonPath('data.abilities.write_texts', true)
        ->assertJsonPath('data.abilities.manage_players', false);
});
