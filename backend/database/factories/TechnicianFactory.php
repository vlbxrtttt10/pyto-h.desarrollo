<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class TechnicianFactory extends Factory
{
    public function definition(): array
    {
        static $sequence = 1;

        return [
            'employee_code' => 'TEC-'.str_pad((string) $sequence++, 4, '0', STR_PAD_LEFT),
            'name' => $this->faker->name(),
            'specialty' => $this->faker->randomElement(['Hidraulica', 'Lubricacion', 'Electromecanica']),
            'hired_at' => $this->faker->dateTimeBetween('-6 years', '-3 months'),
            'photo_url' => null,
        ];
    }
}
