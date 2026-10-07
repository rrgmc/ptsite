<?php

namespace PTSite\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use PTSite\App\Models\Night;
use PTSite\App\Models\Season;

/**
 * @extends Factory<Night>
 */
class NightFactory extends Factory
{
    protected $model = Night::class;

    public function definition(): array
    {
        return [
            'season_id' => Season::factory(),
            'starts_at' => fake()->dateTimeBetween('-1 year')->format('Y-m-d 21:00:00'),
            'status' => 'scheduled',
        ];
    }

    public function open(): static
    {
        return $this->state(['status' => 'open']);
    }
}
