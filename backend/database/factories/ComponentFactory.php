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
            'min_temperature_celsius' => $this->faker->randomFloat(2, 10, 20),
            'max_temperature_celsius' => $this->faker->randomFloat(2, 70, 90),
            'min_pressure_psi' => $this->faker->randomFloat(2, 10, 30),
            'max_pressure_psi' => $this->faker->randomFloat(2, 150, 220),
            'min_grease_level_percent' => $this->faker->randomFloat(2, 15, 25),
        ];
    }
}
