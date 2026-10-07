<?php

namespace PTSite\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use PTSite\App\Models\Place;

/**
 * @extends Factory<Place>
 */
class PlaceFactory extends Factory
{
    protected $model = Place::class;

    public function definition(): array
    {
        return [
            'name' => 'Casa do '.fake()->firstName(),
            'address' => fake()->streetAddress(),
        ];
    }

    public function archived(): static
    {
        return $this->state(['archived_at' => now()]);
    }
}
