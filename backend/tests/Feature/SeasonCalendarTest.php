<?php

/*
 * The season calendar (docs/specs/season-calendar.md): nights with their winner, pot and answers, and the regular
 * nights left out because of holidays.
 */

use Laravel\Sanctum\Sanctum;
use PTSite\App\Models\Night;
use PTSite\App\Models\NightAttendance;
use PTSite\App\Models\Player;
use PTSite\App\Models\Season;
use PTSite\App\Models\User;

beforeEach(function () {
    $this->season = Season::factory()->create([
        'starts_on' => '2027-01-01', 'schedule_weekday' => 5, 'schedule_time' => '21:30', 'schedule_every_weeks' => 2,
    ]);
});

/** Each entry as "d/m kind detail". */
function calendarRows($response): array
{
    return array_map(fn ($e) => substr($e['starts_at'], 8, 2).'/'.substr($e['starts_at'], 5, 2).' '.($e['kind'] === 'night'
        ? $e['night']['status'].($e['night']['winner'] ? ' '.$e['night']['winner'] : '')
        : $e['skip_reason']['kind'].': '.$e['skip_reason']['holiday']), $response->json('data'));
}

it('lists the nights and the regular nights left out, in date order', function () {
    $player = Player::factory()->create(['nickname' => 'Ana']);
    Sanctum::actingAs(User::factory()->create(['player_id' => $player->id]));
    $finished = Night::factory()->for($this->season)->create(['starts_at' => '2027-03-12 21:30:00', 'status' => 'finished', 'pot' => '840.00']);
    $finished->results()->create(['position' => 1, 'player_id' => $player->id, 'points' => '319.20']);
    $next = Night::factory()->for($this->season)->create(['starts_at' => '2027-04-02 21:30:00', 'status' => 'scheduled']);
    NightAttendance::query()->create(['night_id' => $next->id, 'player_id' => $player->id, 'answer' => 'all_in', 'answered_at' => now()]);
    NightAttendance::query()->create(['night_id' => $next->id, 'player_id' => Player::factory()->create()->id, 'answer' => 'all_in', 'answered_at' => now()]);

    $response = $this->getJson("/api/v1/seasons/{$this->season->id}/calendar")->assertOk();

    // Before 12/03 the season had no nights, so its rhythm starts on 01/01 (a holiday): 08/01, 22/01, 05/02 …
    expect(array_slice(calendarRows($response), 0, 6))->toBe([
        '01/01 holiday: Confraternização Universal',
        '05/02 carnival: Carnaval',
        '12/03 finished Ana',
        '26/03 holiday: Sexta-feira Santa',
        '02/04 scheduled',
        '28/05 bridge: Corpus Christi',
    ]);
    $response->assertJsonPath('data.2.night', [
        'id' => $finished->id, 'status' => 'finished', 'place' => null, 'winner' => 'Ana', 'pot' => '840.00', 'all_in_count' => 0, 'my_answer' => null,
    ])->assertJsonPath('data.4.night.all_in_count', 2)
        ->assertJsonPath('data.4.night.my_answer', 'all_in');
});

it('stops at the last night of a finished season', function () {
    Sanctum::actingAs(User::factory()->create());
    $this->season->update(['is_finished' => true, 'is_open' => false]);
    Night::factory()->for($this->season)->create(['starts_at' => '2027-03-12 21:30:00', 'status' => 'finished']);

    expect(calendarRows($this->getJson("/api/v1/seasons/{$this->season->id}/calendar")))
        ->toBe(['01/01 holiday: Confraternização Universal', '05/02 carnival: Carnaval', '12/03 finished']);
});

it('leaves out archived nights', function () {
    Sanctum::actingAs(User::factory()->admin()->create());
    Night::factory()->for($this->season)->create(['starts_at' => '2027-03-12 21:30:00', 'status' => 'scheduled', 'archived_at' => now()]);

    $this->getJson("/api/v1/seasons/{$this->season->id}/calendar")->assertOk()
        ->assertJsonMissing(['kind' => 'night']);
});
