<?php

/*
 * Players through the API, following docs/specs/players.md.
 */

use Laravel\Sanctum\Sanctum;
use PTSite\App\Models\AuditLog;
use PTSite\App\Models\Player;
use PTSite\App\Models\PlayerImage;
use PTSite\App\Models\User;

it('lists players alphabetically, ignoring capitals and accents', function () {
    Sanctum::actingAs(User::factory()->create());
    foreach (['Zé', 'breno', 'Élio', 'Carlão'] as $nickname) {
        Player::factory()->create(['nickname' => $nickname]);
    }

    $this->getJson('/api/v1/players')
        ->assertOk()
        ->assertJsonPath('data.*.nickname', ['breno', 'Carlão', 'Élio', 'Zé']);
});

it('lists active players first, then inactive, and hides archived ones', function () {
    Sanctum::actingAs(User::factory()->create());
    Player::factory()->inactive()->create(['nickname' => 'Ana']);
    Player::factory()->create(['nickname' => 'Breno']);
    Player::factory()->archived()->create(['nickname' => 'Dudu']);

    $this->getJson('/api/v1/players')->assertOk()
        ->assertJsonPath('data.*.nickname', ['Breno', 'Ana']);
});

it('shows archived players only to admins who ask for them', function () {
    Player::factory()->archived()->create(['nickname' => 'Dudu']);

    Sanctum::actingAs(User::factory()->create());
    $this->getJson('/api/v1/players?archived=1')->assertJsonCount(0, 'data');

    Sanctum::actingAs(User::factory()->admin()->create());
    $this->getJson('/api/v1/players?archived=1')->assertJsonCount(1, 'data');
});

it('quick-adds a first-timer by nickname as an active player', function () {
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());

    $this->postJson('/api/v1/players/quick-add', ['nickname' => 'Carlão'])
        ->assertCreated()
        ->assertJsonPath('data.nickname', 'Carlão')
        ->assertJsonPath('data.status', 'active');
});

it('refuses a nickname that already exists, ignoring case, even if archived', function () {
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());
    Player::factory()->archived()->create(['nickname' => 'Dudu']);

    $this->postJson('/api/v1/players/quick-add', ['nickname' => 'dudu'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.nickname.0', 'Já existe um jogador com este apelido.');
});

it('does not let players quick-add', function () {
    Sanctum::actingAs(User::factory()->create());

    $this->postJson('/api/v1/players/quick-add', ['nickname' => 'X'])->assertForbidden();
});

it('lets admins make a player inactive and archive them', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $player = Player::factory()->create();

    $this->patchJson("/api/v1/players/{$player->id}", ['status' => 'inactive'])->assertOk()->assertJsonPath('data.status', 'inactive');
    $this->patchJson("/api/v1/players/{$player->id}", ['archived' => true])->assertOk()->assertJsonPath('data.archived', true);
});

it('shows contact details only to admins and the player themself', function () {
    $player = Player::factory()->create(['email' => 'p@example.com']);

    Sanctum::actingAs(User::factory()->create());
    $this->getJson("/api/v1/players/{$player->id}")->assertJsonMissingPath('data.email');

    Sanctum::actingAs(User::factory()->create(['player_id' => $player->id]));
    $this->getJson("/api/v1/players/{$player->id}")->assertJsonPath('data.email', 'p@example.com');
});

it('lets an admin write a player\'s memo, which every logged-in user reads on the player', function () {
    $ana = Player::factory()->create(['nickname' => 'Ana']);
    $admin = User::factory()->admin()->create();
    Sanctum::actingAs($admin);

    $this->patchJson("/api/v1/players/{$ana->id}", ['memo' => "Fundadora da mesa.\nJoga desde 2009."])->assertOk()
        ->assertJsonPath('data.memo', "Fundadora da mesa.\nJoga desde 2009.");
    $log = AuditLog::query()->where('action', 'player.updated')->where('user_id', $admin->id)->sole();
    expect($log->before['memo'])->toBeNull()
        ->and($log->after['memo'])->toBe("Fundadora da mesa.\nJoga desde 2009.");

    Sanctum::actingAs(User::factory()->create());
    $this->getJson("/api/v1/players/{$ana->id}")->assertOk()->assertJsonPath('data.memo', "Fundadora da mesa.\nJoga desde 2009.");
    // The players list has it too.
    $this->getJson('/api/v1/players?search=Ana')->assertOk()
        ->assertJsonPath('data.0.id', $ana->id)
        ->assertJsonPath('data.0.memo', "Fundadora da mesa.\nJoga desde 2009.");
    // A player inside another answer leaves the memo out.
    Sanctum::actingAs(User::factory()->create(['player_id' => $ana->id]));
    $this->getJson('/api/v1/me')->assertOk()
        ->assertJsonPath('data.player.id', $ana->id)
        ->assertJsonMissingPath('data.player.memo');

    // An empty memo removes it.
    Sanctum::actingAs($admin);
    $this->patchJson("/api/v1/players/{$ana->id}", ['memo' => ''])->assertOk()->assertJsonPath('data.memo', null);
    expect($ana->refresh()->memo)->toBeNull();
});

it('refuses a memo longer than 2000 characters', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $ana = Player::factory()->create();

    $this->patchJson("/api/v1/players/{$ana->id}", ['memo' => str_repeat('a', 2001)])
        ->assertUnprocessable()
        ->assertJsonPath('errors.memo.0', 'O campo memo não pode ter mais de 2000 caracteres.');
});

it('serves a player\'s thumbnail and photo, and says in the player which ones there are', function () {
    Sanctum::actingAs(User::factory()->create());
    $with = Player::factory()->create(['nickname' => 'Ana']);
    $with->forceFill(['thumbnail_version' => 'abc123', 'photo_version' => 'def456'])->save();
    PlayerImage::create(['player_id' => $with->id, 'kind' => 'thumbnail', 'mime_type' => 'image/png', 'image' => 'small png']);
    PlayerImage::create(['player_id' => $with->id, 'kind' => 'photo', 'mime_type' => 'image/jpeg', 'image' => 'large jpeg']);
    $without = Player::factory()->create(['nickname' => 'Breno']);

    $this->getJson('/api/v1/players')->assertOk()
        ->assertJsonPath('data.*.thumbnail_version', ['abc123', null])
        ->assertJsonPath('data.*.photo_version', ['def456', null]);

    $thumbnail = $this->get("/api/v1/players/{$with->id}/thumbnail?v=abc123")->assertOk()
        ->assertHeader('Content-Type', 'image/png');
    expect($thumbnail->getContent())->toBe('small png')
        ->and($thumbnail->headers->get('Cache-Control'))->toContain('max-age=31536000');

    $photo = $this->get("/api/v1/players/{$with->id}/photo?v=def456")->assertOk()
        ->assertHeader('Content-Type', 'image/jpeg');
    expect($photo->getContent())->toBe('large jpeg');

    $this->getJson("/api/v1/players/{$without->id}/thumbnail")->assertNotFound();
    $this->getJson("/api/v1/players/{$without->id}/photo")->assertNotFound();
});

it('does not serve players\' images to visitors who are not logged in', function () {
    $player = Player::factory()->create();
    PlayerImage::create(['player_id' => $player->id, 'kind' => 'thumbnail', 'mime_type' => 'image/png', 'image' => 'small png']);

    $this->getJson("/api/v1/players/{$player->id}/thumbnail")->assertUnauthorized();
    $this->getJson("/api/v1/players/{$player->id}/photo")->assertUnauthorized();
});
