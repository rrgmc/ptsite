<?php

use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use PTSite\App\Models\Night;
use PTSite\App\Models\Season;
use PTSite\App\Models\User;

afterEach(fn () => Carbon::setTestNow());

it('suggests the next three regular weekdays from today', function () {
    Carbon::setTestNow('2025-03-24 10:00:00'); // Monday
    Sanctum::actingAs(User::factory()->resultsKeeper()->create());
    $season = Season::factory()->create(['starts_on' => '2025-01-01', 'schedule_weekday' => 5, 'schedule_time' => '21:30']);

    $this->getJson("/api/v1/seasons/{$season->id}/night-suggestions")->assertOk()
        ->assertJsonPath('data', [
            ['starts_at' => '2025-03-28T21:30:00-03:00'],
            ['starts_at' => '2025-04-04T21:30:00-03:00'],
            ['starts_at' => '2025-04-11T21:30:00-03:00'],
        ]);
});

it('leaves out dates that already have a night, but not archived ones', function () {
    Carbon::setTestNow('2025-03-24 10:00:00');
    Sanctum::actingAs(User::factory()->create());
    $season = Season::factory()->create(['starts_on' => '2025-01-01', 'schedule_time' => '21:00']);
    Night::factory()->for($season)->create(['starts_at' => '2025-03-28 21:00:00', 'status' => 'scheduled']);
    Night::factory()->for($season)->create(['starts_at' => '2025-04-04 21:00:00', 'status' => 'scheduled', 'archived_at' => now()]);

    $this->getJson("/api/v1/seasons/{$season->id}/night-suggestions")
        ->assertJsonPath('data.*.starts_at', ['2025-04-04T21:00:00-03:00', '2025-04-11T21:00:00-03:00', '2025-04-18T21:00:00-03:00']);
});

it('lets admins change the regular night, and checks it', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    $season = Season::factory()->create();

    $this->patchJson("/api/v1/seasons/{$season->id}", ['schedule_weekday' => 6, 'schedule_time' => '12:00'])
        ->assertOk()
        ->assertJsonPath('data.schedule', ['weekday' => 6, 'time' => '12:00', 'every_weeks' => 2]);

    $this->patchJson("/api/v1/seasons/{$season->id}", ['schedule_weekday' => 9])->assertUnprocessable();
});

it('starts a new season with the latest season\'s regular night', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    Season::factory()->create(['starts_on' => '2025-04-01', 'schedule_time' => '21:30']);

    $this->postJson('/api/v1/seasons', ['name' => 'Liga 2026', 'starts_on' => '2026-04-01'])
        ->assertCreated()
        ->assertJsonPath('data.schedule', ['weekday' => 5, 'time' => '21:30', 'every_weeks' => 2]);
});
