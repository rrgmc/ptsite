<?php

use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use PTSite\App\Models\Player;
use PTSite\App\Models\User;

beforeEach(fn () => $this->withHeader('Referer', 'http://localhost'));

it('logs in with a session and returns the user with abilities', function () {
    $player = Player::factory()->create();
    User::factory()->create(['username' => 'maria', 'player_id' => $player->id]);

    $this->postJson('/api/v1/login', ['username' => 'maria', 'password' => 'password', 'remember' => true])
        ->assertOk()
        ->assertJsonPath('data.username', 'maria')
        ->assertJsonPath('data.role', 'player')
        ->assertJsonPath('data.player.id', $player->id)
        ->assertJsonPath('data.abilities.run_nights', false);

    $this->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.username', 'maria');
});

it('refuses a wrong password in Brazilian Portuguese', function () {
    User::factory()->create(['username' => 'maria']);

    $this->postJson('/api/v1/login', ['username' => 'maria', 'password' => 'wrong'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.username.0', 'Usuário ou senha incorretos.');
});

it('refuses a disabled login', function () {
    User::factory()->create(['username' => 'maria', 'is_enabled' => false]);

    $this->postJson('/api/v1/login', ['username' => 'maria', 'password' => 'password'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.username.0', 'Este acesso está desativado.');
});

it('accepts an imported MD5 password once and replaces it with a modern hash', function () {
    $user = User::factory()->legacy('segredo')->create(['username' => 'antigo']);

    $this->postJson('/api/v1/login', ['username' => 'antigo', 'password' => 'segredo'])->assertOk();

    $user->refresh();
    expect($user->legacy_password)->toBeNull()
        ->and(Hash::check('segredo', $user->password))->toBeTrue();
});

it('accepts a salted imported password', function () {
    $user = User::factory()->create(['username' => 'salgado', 'password' => null]);
    $user->forceFill(['legacy_password' => md5('segredo'.'abc123').':abc123'])->save();

    $this->postJson('/api/v1/login', ['username' => 'salgado', 'password' => 'segredo'])->assertOk();
});

it('creates API tokens for other clients', function () {
    User::factory()->create(['username' => 'app']);

    $token = $this->postJson('/api/v1/tokens', ['username' => 'app', 'password' => 'password', 'device_name' => 'celular'])
        ->assertCreated()
        ->json('token');

    $this->withoutHeader('Referer')->withToken($token)->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.username', 'app');
});

it('requires a login for the API', function () {
    $this->getJson('/api/v1/seasons')->assertUnauthorized();
});

it('tells clients what each role may do', function (string $state, bool $runNights, bool $manageSeasons) {
    Sanctum::actingAs(User::factory()->{$state}()->create());

    $this->getJson('/api/v1/me')
        ->assertJsonPath('data.abilities.run_nights', $runNights)
        ->assertJsonPath('data.abilities.manage_seasons', $manageSeasons)
        // Only admins edit a night that is open or finished.
        ->assertJsonPath('data.abilities.edit_played_nights', $manageSeasons);
})->with([
    'results keeper' => ['resultsKeeper', true, false],
    'admin' => ['admin', true, true],
]);
