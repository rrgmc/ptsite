<?php

use Laravel\Sanctum\Sanctum;
use PTSite\App\Models\Night;
use PTSite\App\Models\Player;
use PTSite\App\Models\Season;
use PTSite\App\Models\User;

it('calculates standings from finished nights', function () {
    Sanctum::actingAs($admin = User::factory()->admin()->create());
    $season = Season::factory()->create();
    [$ana, $breno] = Player::factory()->count(2)->create()->all();
    $others = Player::factory()->count(5)->create()->all();

    $finish = function (array $order, string $pot) use ($season) {
        $night = Night::factory()->for($season)->open()->create();
        $this->postJson("/api/v1/nights/{$night->id}/finish", [
            'pot' => $pot,
            'main_event_pot' => '0',
            'time_chip' => '0',
            'positions' => array_map(fn ($p, $i) => ['position' => $i + 1, 'player_id' => $p->id], $order, array_keys($order)),
        ])->assertOk();
    };
    $finish([$ana, $breno, ...array_slice($others, 0, 4)], '300.00');
    $finish([$breno, $others[0], $ana, ...array_slice($others, 1, 3)], '300.00');

    $this->getJson("/api/v1/seasons/{$season->id}/standings")->assertOk()
        ->assertJsonPath('data.0.player.id', $breno->id)
        ->assertJsonPath('data.0.points', '183.00')
        ->assertJsonPath('data.1.player.id', $ana->id)
        ->assertJsonPath('data.1.points', '159.00');
});

it('simulates a night without saving anything', function () {
    Sanctum::actingAs(User::factory()->create());
    $season = Season::factory()->create();
    $players = Player::factory()->count(6)->create()->all();

    $this->postJson("/api/v1/seasons/{$season->id}/simulate", [
        'pot' => '400.00',
        'positions' => array_map(fn ($p, $i) => ['position' => $i + 1, 'player_id' => $p->id], $players, array_keys($players)),
    ])->assertOk()
        ->assertJsonPath('data.0.player.id', $players[0]->id)
        ->assertJsonPath('data.0.simulated_points', '152.00')
        ->assertJsonPath('data.0.movement', null);

    expect(Night::count())->toBe(0);
});

it('returns the current season', function () {
    Sanctum::actingAs(User::factory()->create());
    Season::factory()->create(['name' => 'Old', 'starts_on' => '2024-01-01', 'is_finished' => true]);
    Season::factory()->create(['name' => 'Now', 'starts_on' => '2025-04-01']);

    $this->getJson('/api/v1/seasons/current')->assertOk()->assertJsonPath('data.name', 'Now');
});

it('refuses a percentage table that does not add up to 100, showing the total', function () {
    Sanctum::actingAs(User::factory()->admin()->create());

    $this->postJson('/api/v1/seasons', [
        'name' => 'Liga 2027',
        'starts_on' => '2027-01-01',
        'percentages' => collect([40, 23, 15, 11, 8, 5])->map(fn ($p, $i) => ['position' => $i + 1, 'percent' => $p])->all(),
    ])
        ->assertUnprocessable()
        ->assertJsonPath('errors.percentages.0', 'As porcentagens devem somar 100%. Total atual: 102%.');
});

it('creates a season with the standard table when none is given', function () {
    Sanctum::actingAs(User::factory()->admin()->create());

    $this->postJson('/api/v1/seasons', ['name' => 'Liga 2027', 'starts_on' => '2027-01-01'])
        ->assertCreated()
        ->assertJsonPath('data.percentages.0', ['position' => 1, 'percent' => 38]);
});

it('does not let non-admins create seasons', function () {
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());

    $this->postJson('/api/v1/seasons', ['name' => 'X', 'starts_on' => '2027-01-01'])->assertForbidden();
});
