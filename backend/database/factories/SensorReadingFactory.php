<?php

namespace Database\Factories;

use App\Models\Component;
use App\Models\Equipment;
use Illuminate\Database\Eloquent\Factories\Factory;

class SensorReadingFactory extends Factory
{
    public function definition(): array
    {
        return [
            'equipment_id' => Equipment::factory(),
            'component_id' => Component::factory(),
            'temperature_celsius' => $this->faker->randomFloat(2, 30, 60),
            'pressure_psi' => $this->faker->randomFloat(2, 40, 140),
            'grease_level_percent' => $this->faker->randomFloat(2, 40, 90),
            'read_at' => $this->faker->dateTimeBetween('-90 days', 'now'),
            'source' => 'simulado',
        ];
    }
}
