<?php

/*
 * Places through the API.
 */

use Laravel\Sanctum\Sanctum;
use PTSite\App\Models\AuditLog;
use PTSite\App\Models\Place;
use PTSite\App\Models\User;

it('lists places by name and hides archived ones', function () {
    Sanctum::actingAs(User::factory()->create());
    Place::factory()->create(['name' => 'Casa do Zé']);
    Place::factory()->create(['name' => 'Bar do Breno']);
    Place::factory()->archived()->create(['name' => 'Salão do Clube']);

    $this->getJson('/api/v1/places')->assertOk()
        ->assertJsonPath('data.*.name', ['Bar do Breno', 'Casa do Zé']);
});

it('shows archived places only to admins who ask for them', function () {
    Place::factory()->archived()->create();

    Sanctum::actingAs(User::factory()->create());
    $this->getJson('/api/v1/places?archived=1')->assertJsonCount(0, 'data');

    Sanctum::actingAs(User::factory()->admin()->create());
    $this->getJson('/api/v1/places?archived=1')->assertJsonCount(1, 'data')->assertJsonPath('data.0.archived', true);
});

it('lets admins archive a place and restore it', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $place = Place::factory()->create();

    $this->patchJson("/api/v1/places/{$place->id}", ['archived' => true])->assertOk()->assertJsonPath('data.archived', true);
    $this->getJson('/api/v1/places')->assertJsonCount(0, 'data');

    $this->patchJson("/api/v1/places/{$place->id}", ['archived' => false])->assertOk()->assertJsonPath('data.archived', false);
    $this->getJson('/api/v1/places')->assertJsonCount(1, 'data');

    expect(AuditLog::query()->pluck('action')->all())->toBe(['place.updated', 'place.updated']);
});

it('lets only admins change places', function () {
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());
    $place = Place::factory()->create();

    $this->postJson('/api/v1/places', ['name' => 'X'])->assertForbidden();
    $this->patchJson("/api/v1/places/{$place->id}", ['archived' => true])->assertForbidden();
});
