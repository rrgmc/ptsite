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

it('lists every season with the first ten of its standings', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $old = Season::factory()->create(['name' => 'Old', 'starts_on' => '2024-01-01', 'is_finished' => true, 'rounds' => 12]);
    $now = Season::factory()->create(['name' => 'Now', 'starts_on' => '2025-04-01', 'rounds' => 12]);
    $empty = Season::factory()->create(['name' => 'Next', 'starts_on' => '2026-04-01']);
    $archived = Season::factory()->create(['name' => 'Gone', 'starts_on' => '2023-01-01', 'archived_at' => now()]);
    $players = Player::factory()->count(12)->create()->all();

    $finish = function (Season $season, array $order) {
        $night = Night::factory()->for($season)->open()->create();
        $this->postJson("/api/v1/nights/{$night->id}/finish", [
            'pot' => '300.00',
            'main_event_pot' => '0',
            'time_chip' => '0',
            'positions' => array_map(fn ($p, $i) => ['position' => $i + 1, 'player_id' => $p->id], $order, array_keys($order)),
        ])->assertOk();
    };
    // Twelve players score in the old season, over two nights: only ten are shown.
    $finish($old, array_slice($players, 0, 6));
    $finish($old, array_slice($players, 6, 6));
    $finish($now, array_slice($players, 0, 6));
    $finish($archived, array_slice($players, 0, 6));

    $this->getJson('/api/v1/seasons/top-standings')->assertOk()
        ->assertJsonCount(3, 'data')
        ->assertJsonPath('data.0.season.id', $empty->id)
        ->assertJsonPath('data.0.rows', [])
        ->assertJsonPath('data.0.tied_not_shown', 0)
        ->assertJsonPath('data.1.season.id', $now->id)
        ->assertJsonPath('data.1.season.nights_count', 1)
        ->assertJsonCount(6, 'data.1.rows')
        ->assertJsonPath('data.1.rows.0.player.id', $players[0]->id)
        ->assertJsonPath('data.1.rows.0.points', '114.00')
        ->assertJsonPath('data.2.season.id', $old->id)
        ->assertJsonCount(10, 'data.2.rows')
        // The two winners share the first place; the two sixth places share the eleventh, past the cut.
        ->assertJsonPath('data.2.rows.0.rank', 1)
        ->assertJsonPath('data.2.rows.1.rank', 1)
        ->assertJsonPath('data.2.rows.9.rank', 9)
        ->assertJsonPath('data.2.rows.9.points', '24.00')
        ->assertJsonPath('data.2.tied_not_shown', 0);
});

it('counts the players tied with the tenth who do not fit', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $season = Season::factory()->create();
    $players = Player::factory()->count(11)->create()->all();

    // Eleven players score. The sixth place of each night has 15.00: they share the tenth place.
    foreach ([array_slice($players, 0, 6), [...array_slice($players, 6, 4), $players[0], $players[10]]] as $order) {
        $night = Night::factory()->for($season)->open()->create();
        $this->postJson("/api/v1/nights/{$night->id}/finish", [
            'pot' => '300.00',
            'main_event_pot' => '0',
            'time_chip' => '0',
            'positions' => array_map(fn ($p, $i) => ['position' => $i + 1, 'player_id' => $p->id], $order, array_keys($order)),
        ])->assertOk();
    }

    $this->getJson('/api/v1/seasons/top-standings')->assertOk()
        ->assertJsonCount(10, 'data.0.rows')
        ->assertJsonPath('data.0.rows.0.player.id', $players[0]->id)
        ->assertJsonPath('data.0.rows.0.points', '138.00')
        ->assertJsonPath('data.0.rows.9.rank', 10)
        ->assertJsonPath('data.0.rows.9.player.id', $players[5]->id)
        ->assertJsonPath('data.0.rows.9.points', '15.00')
        ->assertJsonPath('data.0.tied_not_shown', 1);
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

it('saves the money settings of a season', function () {
    config(['ptsite.features' => ['houseOwnerBuyIn' => true]]);
    Sanctum::actingAs(User::factory()->admin()->create());

    $id = $this->postJson('/api/v1/seasons', [
        'name' => 'Liga 2027',
        'starts_on' => '2027-01-01',
        'buy_in' => '50',
        'rebuy_value' => '50.00',
        'time_chip_value' => '5',
        'rebuys_allowed' => 2,
        'rebuy_charges_time_chip' => true,
        'allows_extra_rebuys' => true,
        'house_owner_buy_in' => '25.00',
    ])
        ->assertCreated()
        ->assertJsonPath('data.buy_in', '50.00')
        ->assertJsonPath('data.rebuy_value', '50.00')
        ->assertJsonPath('data.time_chip_value', '5.00')
        ->assertJsonPath('data.rebuys_allowed', 2)
        ->assertJsonPath('data.rebuy_charges_time_chip', true)
        ->assertJsonPath('data.allows_extra_rebuys', true)
        ->assertJsonPath('data.house_owner_buy_in', '25.00')
        ->json('data.id');

    // Only the fields sent change.
    $this->patchJson("/api/v1/seasons/{$id}", ['rebuys_allowed' => 1, 'house_owner_buy_in' => null])
        ->assertOk()
        ->assertJsonPath('data.rebuys_allowed', 1)
        ->assertJsonPath('data.rebuy_value', '50.00')
        ->assertJsonPath('data.house_owner_buy_in', null);
});

it('starts a season with no rebuys and no amounts', function () {
    Sanctum::actingAs(User::factory()->admin()->create());

    $this->postJson('/api/v1/seasons', ['name' => 'Liga 2027', 'starts_on' => '2027-01-01'])
        ->assertCreated()
        ->assertJsonPath('data.buy_in', null)
        ->assertJsonPath('data.rebuy_value', null)
        ->assertJsonPath('data.rebuys_allowed', 0)
        ->assertJsonPath('data.rebuy_charges_time_chip', false)
        ->assertJsonPath('data.allows_extra_rebuys', false);
});

it('requires the rebuy value of a season with rebuys', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $season = Season::factory()->create(['rebuy_value' => null, 'rebuys_allowed' => 0]);

    $this->patchJson("/api/v1/seasons/{$season->id}", ['rebuys_allowed' => 2])
        ->assertUnprocessable()
        ->assertJsonPath('errors.rebuy_value.0', 'Informe o valor do rebuy, ou deixe a temporada sem rebuys.');
    $this->patchJson("/api/v1/seasons/{$season->id}", ['allows_extra_rebuys' => true])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['rebuy_value']);

    $this->patchJson("/api/v1/seasons/{$season->id}", ['rebuys_allowed' => 2, 'rebuy_value' => '30'])->assertOk();
    // The stored number of rebuys still needs the value.
    $this->patchJson("/api/v1/seasons/{$season->id}", ['rebuy_value' => null])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['rebuy_value']);
});

it('refuses money settings in a wrong format', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $season = Season::factory()->create();

    $this->patchJson("/api/v1/seasons/{$season->id}", ['buy_in' => '50,00', 'rebuy_value' => '-5', 'time_chip_value' => '5.123', 'rebuys_allowed' => 21])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['buy_in', 'rebuy_value', 'time_chip_value', 'rebuys_allowed']);
});

it('keeps the house owner\'s buy-in at or below the buy-in', function () {
    config(['ptsite.features' => ['houseOwnerBuyIn' => true]]);
    Sanctum::actingAs(User::factory()->admin()->create());
    $season = Season::factory()->create(['buy_in' => '50.00']);

    $this->patchJson("/api/v1/seasons/{$season->id}", ['house_owner_buy_in' => '60.00'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.house_owner_buy_in.0', 'O buy-in do dono da casa não pode ser maior que o buy-in.');
    $this->patchJson("/api/v1/seasons/{$season->id}", ['buy_in' => null, 'house_owner_buy_in' => '25.00'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.house_owner_buy_in.0', 'Informe o buy-in antes do buy-in do dono da casa.');

    $this->patchJson("/api/v1/seasons/{$season->id}", ['house_owner_buy_in' => '50.00'])->assertOk();
    // Lowering the buy-in below the stored house owner's buy-in is refused too.
    $this->patchJson("/api/v1/seasons/{$season->id}", ['buy_in' => '40.00'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['house_owner_buy_in']);
});

it('refuses the house owner\'s buy-in on a site without it', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $season = Season::factory()->create(['buy_in' => '50.00', 'house_owner_buy_in' => '45.00']);

    $this->patchJson("/api/v1/seasons/{$season->id}", ['house_owner_buy_in' => '25.00'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.house_owner_buy_in.0', 'Este site não usa o campo buy-in do dono da casa.');

    // A value stored before the feature was turned off does not block the buy-in.
    $this->patchJson("/api/v1/seasons/{$season->id}", ['buy_in' => '40.00'])->assertOk();
});

it('refuses the time chip settings on a site without the time chip', function () {
    config(['ptsite.features' => ['timeChip' => false]]);
    Sanctum::actingAs(User::factory()->admin()->create());
    $season = Season::factory()->create();

    $this->patchJson("/api/v1/seasons/{$season->id}", ['time_chip_value' => '5.00', 'rebuy_charges_time_chip' => true])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['time_chip_value', 'rebuy_charges_time_chip']);

    $this->patchJson("/api/v1/seasons/{$season->id}", ['rebuy_value' => '40.00'])->assertOk();
});
