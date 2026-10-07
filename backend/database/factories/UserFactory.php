<?php

namespace PTSite\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PTSite\App\Enums\Role;
use PTSite\App\Models\User;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    protected static ?string $password;

    public function definition(): array
    {
        return [
            'username' => fake()->unique()->userName(),
            'name' => fake()->name(),
            'email' => fake()->safeEmail(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => Role::Player,
            'is_enabled' => true,
            'remember_token' => Str::random(10),
        ];
    }

    public function admin(): static
    {
        return $this->state(['role' => Role::Admin]);
    }

    public function resultsKeeper(): static
    {
        return $this->state(['role' => Role::ResultsKeeper]);
    }

    /** A user imported from an older site, with an unsalted MD5 hash and no modern password yet. */
    public function legacy(string $password): static
    {
        return $this->state(['password' => null])->afterMaking(function (User $user) use ($password) {
            $user->legacy_password = md5($password);
        });
    }
}
