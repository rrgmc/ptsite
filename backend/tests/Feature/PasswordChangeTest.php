<?php

/*
 * A user changes their own password, following docs/specs/accounts-and-roles.md (rule 11).
 */

use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use PTSite\App\Models\AuditLog;
use PTSite\App\Models\User;

it('lets a user change their own password with the current one', function () {
    $maria = User::factory()->create(['username' => 'maria']);
    $phone = $maria->createToken('celular');
    $tablet = $maria->createToken('tablet');

    $this->withToken($phone->plainTextToken)
        ->putJson('/api/v1/me/password', ['current_password' => 'password', 'password' => 'mesa-verde-7'])
        ->assertNoContent();

    $maria->refresh();
    expect(Hash::check('mesa-verde-7', $maria->password))->toBeTrue()
        // The token that asked keeps working; the user's other tokens are gone.
        ->and($maria->tokens()->pluck('id')->all())->toBe([$phone->accessToken->id])
        ->and($tablet->accessToken->fresh())->toBeNull();

    $log = AuditLog::query()->where('action', 'login.password_changed')->sole();
    expect($log->user_id)->toBe($maria->id)
        ->and(json_encode($log->getAttributes()))->not->toContain('mesa-verde-7');
});

it('logs in with the new password and no longer with the old one', function () {
    $maria = User::factory()->create(['username' => 'maria']);
    Sanctum::actingAs($maria);
    $this->putJson('/api/v1/me/password', ['current_password' => 'password', 'password' => 'mesa-verde-7'])->assertNoContent();

    $this->postJson('/api/v1/tokens', ['username' => 'maria', 'password' => 'password', 'device_name' => 'x'])->assertUnprocessable();
    $this->postJson('/api/v1/tokens', ['username' => 'maria', 'password' => 'mesa-verde-7', 'device_name' => 'x'])->assertCreated();
});

it('refuses a password change with a wrong current password', function () {
    $maria = User::factory()->create(['username' => 'maria']);
    Sanctum::actingAs($maria);

    $this->putJson('/api/v1/me/password', ['current_password' => 'errada', 'password' => 'mesa-verde-7'])
        ->assertUnprocessable()
        ->assertJsonPath('rule', 'account.wrong_current_password')
        ->assertJsonPath('errors.current_password.0', 'A senha atual está incorreta.');
    expect(Hash::check('password', $maria->refresh()->password))->toBeTrue()
        ->and(AuditLog::query()->count())->toBe(0);
});

it('refuses a new password shorter than 8 characters', function () {
    Sanctum::actingAs(User::factory()->create());

    $this->putJson('/api/v1/me/password', ['current_password' => 'password', 'password' => 'curta'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.password.0', 'O campo senha deve ter pelo menos 8 caracteres.');
});

it('does not change a password for a visitor who is not logged in', function () {
    $this->putJson('/api/v1/me/password', ['current_password' => 'password', 'password' => 'mesa-verde-7'])->assertUnauthorized();
});
