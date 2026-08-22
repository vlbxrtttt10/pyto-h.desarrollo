<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class TruckFactory extends Factory
{
    public function definition(): array
    {
        static $sequence = 1;

        return [
            'code' => 'CAM-'.str_pad((string) $sequence++, 3, '0', STR_PAD_LEFT),
            'model' => $this->faker->randomElement([
                'Caterpillar 797F',
                'Komatsu 930E',
                'Liebherr T 284',
                'Belaz 75710',
            ]),
            'tank_capacity_liters' => $this->faker->randomFloat(2, 3800, 5500),
            'empty_weight_tons' => $this->faker->randomFloat(2, 180, 250),
            'max_payload_tons' => $this->faker->randomFloat(2, 220, 360),
            'status' => 'active',
        ];
    }
}
