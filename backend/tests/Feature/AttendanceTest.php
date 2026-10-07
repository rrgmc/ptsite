<?php

/*
 * Attendance through the API, following the examples in docs/specs/attendance.md.
 */

use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use PTSite\App\Models\AuditLog;
use PTSite\App\Models\Night;
use PTSite\App\Models\Player;
use PTSite\App\Models\User;

afterEach(fn () => Carbon::setTestNow());

beforeEach(function () {
    $this->night = Night::factory()->create(['starts_at' => '2025-03-28 21:30:00', 'status' => 'open']);
    foreach (['ana' => 'Ana', 'breno' => 'Breno', 'carla' => 'Carla', 'dudu' => 'Dudu'] as $key => $nickname) {
        $this->{$key} = Player::factory()->create(['nickname' => $nickname]);
        $this->{"{$key}User"} = User::factory()->create(['player_id' => $this->{$key}->id]);
    }
    $this->answer = function (User $as, Player $for, ?string $answer, string $at) {
        Carbon::setTestNow($at);
        Sanctum::actingAs($as);
        $url = "/api/v1/nights/{$this->night->id}/attendance/{$for->id}";

        return $answer === null ? $this->deleteJson($url) : $this->putJson($url, ['answer' => $answer]);
    };
    $this->lists = function () {
        $rows = collect($this->getJson("/api/v1/nights/{$this->night->id}/attendance")->assertOk()->json('data'));

        return [
            'coming' => $rows->where('answer', 'all_in')->pluck('player.nickname')->values()->all(),
            'fold' => $rows->where('answer', 'fold')->pluck('player.nickname')->values()->all(),
        ];
    };
});

it('lists who is coming in the order they answered, and who folded', function () {
    ($this->answer)($this->anaUser, $this->ana, 'all_in', '2025-03-24 10:00')->assertOk();
    ($this->answer)($this->brenoUser, $this->breno, 'all_in', '2025-03-24 11:00')->assertOk();
    ($this->answer)($this->carlaUser, $this->carla, 'fold', '2025-03-24 12:00')->assertOk();

    expect(($this->lists)())->toBe(['coming' => ['Ana', 'Breno'], 'fold' => ['Carla']]);
});

it('moves a changed answer to the end, keeps a repeated one in place, and removes answers', function () {
    ($this->answer)($this->anaUser, $this->ana, 'all_in', '2025-03-24 10:00');
    ($this->answer)($this->brenoUser, $this->breno, 'all_in', '2025-03-24 11:00');
    ($this->answer)($this->carlaUser, $this->carla, 'fold', '2025-03-24 12:00');

    ($this->answer)($this->anaUser, $this->ana, 'fold', '2025-03-26 09:00');
    ($this->answer)($this->brenoUser, $this->breno, 'all_in', '2025-03-27 09:00');
    expect(($this->lists)())->toBe(['coming' => ['Breno'], 'fold' => ['Carla', 'Ana']]);

    ($this->answer)($this->carlaUser, $this->carla, null, '2025-03-27 10:00')->assertNoContent();
    expect(($this->lists)())->toBe(['coming' => ['Breno'], 'fold' => ['Ana']]);
});

it('lets a results keeper answer for someone else, recording who and auditing it', function () {
    $keeper = User::factory()->resultsKeeper()->create(['name' => 'Maria']);

    ($this->answer)($keeper, $this->dudu, 'all_in', '2025-03-25 10:00')
        ->assertOk()
        ->assertJsonPath('data.answered_by.name', 'Maria');

    expect(AuditLog::query()->where('action', 'attendance.set_for_player')->where('user_id', $keeper->id)->exists())->toBeTrue();
});

it('does not let a player answer for someone else, or audit their own answers', function () {
    ($this->answer)($this->anaUser, $this->breno, 'all_in', '2025-03-24 10:00')->assertForbidden();
    ($this->answer)($this->anaUser, $this->ana, 'all_in', '2025-03-24 10:00')->assertOk()->assertJsonPath('data.answered_by', null);

    expect(AuditLog::query()->where('action', 'like', 'attendance.%')->count())->toBe(0);
});

it('refuses answers before the night is open, from players and results keepers alike', function () {
    $this->night->update(['status' => 'scheduled']);
    $keeper = User::factory()->resultsKeeper()->create();

    ($this->answer)($this->anaUser, $this->ana, 'all_in', '2025-03-24 10:00')
        ->assertUnprocessable()
        ->assertJsonPath('rule', 'attendance.not_open')
        ->assertJsonPath('message', 'As confirmações começam quando o evento for aberto.');
    ($this->answer)($keeper, $this->dudu, 'all_in', '2025-03-24 11:00')->assertUnprocessable();
    ($this->answer)($this->anaUser, $this->ana, null, '2025-03-24 12:00')->assertUnprocessable();

    expect(($this->lists)())->toBe(['coming' => [], 'fold' => []]);
});

it('takes answers while the night is open, and refuses them once it is finished', function () {
    ($this->answer)($this->anaUser, $this->ana, 'all_in', '2025-03-28 18:00')->assertOk();

    $this->night->update(['status' => 'finished']);
    ($this->answer)($this->brenoUser, $this->breno, 'all_in', '2025-03-29 10:00')
        ->assertUnprocessable()
        ->assertJsonPath('message', 'As confirmações deste evento estão encerradas.');
});
