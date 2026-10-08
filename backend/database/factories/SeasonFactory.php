<?php

namespace PTSite\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use PTSite\App\Models\Season;

/**
 * @extends Factory<Season>
 */
class SeasonFactory extends Factory
{
    protected $model = Season::class;

    public function definition(): array
    {
        return [
            'name' => 'Liga '.fake()->unique()->year(),
            'starts_on' => fake()->date(),
            'buy_in' => '50.00',
            'rebuy_value' => '50.00',
            'time_chip_value' => '5.00',
            'rebuys_allowed' => 2,
            'rebuy_charges_time_chip' => true,
            'is_open' => true,
            'is_finished' => false,
        ];
    }

    /** Adds the standard percentage table: 38, 23, 15, 11, 8, 5. */
    public function configure(): static
    {
        return $this->afterCreating(function (Season $season) {
            foreach ([1 => 38, 2 => 23, 3 => 15, 4 => 11, 5 => 8, 6 => 5] as $position => $percent) {
                $season->percentages()->create(['position' => $position, 'percent' => $percent]);
            }
        });
    }
}
