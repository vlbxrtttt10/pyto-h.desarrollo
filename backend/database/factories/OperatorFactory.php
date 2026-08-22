<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class OperatorFactory extends Factory
{
    public function definition(): array
    {
        static $sequence = 1;

        return [
            'employee_code' => 'OP-'.str_pad((string) $sequence++, 4, '0', STR_PAD_LEFT),
            'name' => $this->faker->name(),
            'shift' => $this->faker->randomElement(['Dia', 'Noche']),
            'hired_at' => $this->faker->dateTimeBetween('-6 years', '-3 months'),
            'photo_url' => null,
        ];
    }
}
