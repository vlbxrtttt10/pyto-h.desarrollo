<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ComponentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement([
                'Bomba Zeus', 'Gabinete Kronos', 'Sistema de dispensado', 'Valvula de alivio',
            ]),
            'equipment_type' => $this->faker->randomElement(['ULM', 'ULP', 'UMO', 'ULE']),
            'expected_pressure_psi' => $this->faker->randomFloat(2, 150, 220),
            'expected_volume_liters' => $this->faker->randomFloat(2, 8, 25),
            'expected_cycle_minutes' => $this->faker->randomFloat(2, 3, 12),
        ];
    }
}
