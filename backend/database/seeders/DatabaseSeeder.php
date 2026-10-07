<?php

namespace PTSite\Database\Seeders;

use Illuminate\Database\Seeder;
use PTSite\App\Enums\Role;
use PTSite\App\Models\Player;
use PTSite\App\Models\User;

/**
 * Local development data: the invented league of DemoLeagueSeeder, plus three logins with known passwords, one
 * per role. Never run in production.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            $this->command->error('The development seeder does not run in production.');

            return;
        }

        if (! Player::query()->exists()) {
            $this->call(DemoLeagueSeeder::class);
        }

        $player = Player::query()->notArchived()->where('status', 'active')->whereDoesntHave('user')->orderBy('nickname')->first()
            ?? Player::factory()->create(['nickname' => 'Jogador Dev']);

        foreach ([
            // Only dev-admin has an email, so only it can get a password link (it goes to Mailpit).
            ['dev-admin', 'Admin (dev)', Role::Admin, null, 'dev-admin@example.org'],
            ['dev-keeper', 'Responsável (dev)', Role::ResultsKeeper, null, null],
            ['dev-player', "{$player->nickname} (dev)", Role::Player, $player->id, null],
        ] as [$username, $name, $role, $playerId, $email]) {
            User::query()->updateOrCreate(['username' => $username], [
                'name' => $name, 'email' => $email, 'password' => 'password', 'role' => $role, 'is_enabled' => true, 'player_id' => $playerId,
            ]);
        }
        $this->command->info('Dev logins (password "password"): dev-admin, dev-keeper, dev-player.');
    }
}
