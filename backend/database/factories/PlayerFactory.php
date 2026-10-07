<?php

namespace PTSite\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use PTSite\App\Enums\PlayerStatus;
use PTSite\App\Models\Player;

/**
 * @extends Factory<Player>
 */
class PlayerFactory extends Factory
{
    protected $model = Player::class;

    public function definition(): array
    {
        return [
            'nickname' => fake()->unique()->firstName().' '.fake()->unique()->numberBetween(1, 99999),
            'name' => fake()->name(),
            'email' => fake()->safeEmail(),
            'status' => PlayerStatus::Active,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['status' => PlayerStatus::Inactive]);
    }

    public function archived(): static
    {
        return $this->state(['archived_at' => now()]);
    }
}
