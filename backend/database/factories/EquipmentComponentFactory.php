<?php

namespace Database\Factories;

use App\Models\Component;
use App\Models\Equipment;
use Illuminate\Database\Eloquent\Factories\Factory;

class EquipmentComponentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'equipment_id' => Equipment::factory(),
            'component_id' => Component::factory(),
            'installed_at' => $this->faker->dateTimeBetween('-2 years', '-6 months'),
        ];
    }
}
