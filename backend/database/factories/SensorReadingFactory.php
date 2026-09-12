<?php

namespace Database\Factories;

use App\Models\EquipmentComponent;
use Illuminate\Database\Eloquent\Factories\Factory;

class SensorReadingFactory extends Factory
{
    public function definition(): array
    {
        return [
            'equipment_component_id' => EquipmentComponent::factory(),
            'temperature_celsius' => $this->faker->randomFloat(2, 30, 60),
            'pressure_psi' => $this->faker->randomFloat(2, 40, 140),
            'grease_level_percent' => $this->faker->randomFloat(2, 40, 90),
            'read_at' => $this->faker->dateTimeBetween('-90 days', 'now'),
            'source' => 'simulado',
        ];
    }
}
