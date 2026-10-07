<?php

/*
 * The name stored with a login token (personal_access_tokens.tokenable_type). It is "user", not the model's
 * class name, so the tokens do not depend on where the model lives in the code.
 */

use Illuminate\Support\Facades\DB;
use PTSite\App\Models\User;

it('stores "user" with a new token', function () {
    $user = User::factory()->create();
    $user->createToken('celular');

    expect(DB::table('personal_access_tokens')->value('tokenable_type'))->toBe('user');
});

it('accepts a token stored with the model\'s usual Laravel name', function () {
    $user = User::factory()->create();
    $token = $user->createToken('celular');
    DB::table('personal_access_tokens')->update(['tokenable_type' => 'App\Models\User']);

    $this->getJson('/api/v1/me', ['Authorization' => "Bearer {$token->plainTextToken}"])
        ->assertOk()
        ->assertJsonPath('data.username', $user->username);
});
