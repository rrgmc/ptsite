<?php

namespace PTSite\Database\Seeders;

use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use PTSite\App\Enums\Role;
use PTSite\App\Models\PasswordReset;
use PTSite\App\Models\Place;
use PTSite\App\Models\Season;
use PTSite\App\Models\User;

/**
 * Seasons and logins the end-to-end tests change, added on top of the development seed (frontend/scripts/e2e-server.mjs). The
 * tests use these instead of the demo league's seasons, so the two can change apart. Each one
 * is open, but starts before the demo league's current season, so it never becomes the current season. Never run in
 * production.
 */
class EndToEndSeeder extends Seeder
{
    /** The token of the password link of "e2e-reset". The same value is in frontend/tests/password-reset.spec.ts. */
    private const PASSWORD_RESET_TOKEN = 'e2e-password-reset-token';

    public function run(): void
    {
        if (app()->isProduction()) {
            $this->command->error('The end-to-end seeder does not run in production.');

            return;
        }

        DB::transaction(function () {
            // Scheduling, attendance and moving nights (attendance.spec.ts, reschedule.spec.ts).
            $this->season('E2E Agenda', '2020-01-01', '21:30');

            // Opening and finishing nights (results-keeper.spec.ts).
            $this->season('E2E Resultados', '2023-01-01', '21:30');

            // The partial result of an open night (partial-result.spec.ts).
            $this->season('E2E Parcial', '2021-01-01', '21:30');

            // The planner with all rounds already planned (season-planner.spec.ts): 26 nights, Fridays at 21:00
            // every other week. The last one sets the cadence the plans for 2027 carry on from.
            $planned = $this->season('E2E Planejamento', '2018-12-21', '21:00');
            for ($i = 0, $night = CarbonImmutable::parse('2018-12-21 21:00'); $i < 26; $i++, $night = $night->addWeeks(2)) {
                $planned->nights()->create(['starts_at' => $night, 'place_id' => $planned->default_place_id, 'status' => 'scheduled']);
            }

            // The planner with every round still to plan (season-planner.spec.ts).
            $this->season('E2E Rodadas', '2023-01-01', '21:30');

            // The Main Event night and an extra night (main-event.spec.ts).
            $this->season('E2E Main Event', '2017-01-01', '21:30');

            // A forgotten password (password-reset.spec.ts). The tests cannot read the email, so one account
            // already has a link with a known token. The other asks for a link.
            $reset = $this->login('e2e-reset');
            PasswordReset::query()->create([
                'user_id' => $reset->id,
                'token_hash' => hash('sha256', self::PASSWORD_RESET_TOKEN),
                'expires_at' => now()->addDay(),
                'created_at' => now(),
            ]);
            $this->login('e2e-forgot');
        });

        $this->command->info('End-to-end seasons added.');
    }

    /** A login with no player, whose email can get a password link. */
    private function login(string $username): User
    {
        return User::query()->create([
            'username' => $username, 'name' => $username, 'email' => "{$username}@example.org",
            'password' => 'password', 'role' => Role::Player, 'is_enabled' => true,
        ]);
    }

    private function season(string $name, string $startsOn, string $time): Season
    {
        $season = Season::query()->create([
            'name' => $name,
            'starts_on' => $startsOn,
            'default_place_id' => Place::query()->notArchived()->orderBy('id')->value('id'),
            'buy_in' => '50.00',
            'rebuy_value' => '50.00',
            'time_chip_value' => '5.00',
            'rebuys_allowed' => 2,
            'rebuy_charges_time_chip' => true,
            'allows_extra_rebuys' => true,
            'house_owner_buy_in' => '25.00',
            'is_open' => true,
            'is_finished' => false,
            'schedule_weekday' => 5,
            'schedule_time' => $time,
            'schedule_every_weeks' => 2,
            'rounds' => 26,
        ]);
        foreach ([1 => 38, 2 => 23, 3 => 15, 4 => 11, 5 => 8, 6 => 5] as $position => $percent) {
            $season->percentages()->create(['position' => $position, 'percent' => $percent]);
        }

        return $season;
    }
}
