<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class HaulRouteFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement([
                'Rampa Norte - Chancadora Primaria',
                'Tajo Sur - Botadero Este',
                'Pit Central - Stock de Mineral',
                'Rampa Oeste - Planta de Lixiviacion',
            ]),
            'origin' => $this->faker->randomElement(['Pit Norte', 'Pit Sur', 'Pit Central', 'Pit Oeste']),
            'destination' => $this->faker->randomElement(['Chancadora Primaria', 'Botadero Este', 'Stockpile', 'Planta']),
            'distance_km' => $this->faker->randomFloat(2, 2.5, 9.5),
            'average_grade_percent' => $this->faker->randomFloat(2, -3, 8),
            'base_liters_per_ton_km' => $this->faker->randomFloat(4, 0.018, 0.028),
        ];
    }
}
