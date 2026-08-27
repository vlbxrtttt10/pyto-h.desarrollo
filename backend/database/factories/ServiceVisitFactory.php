<?php

namespace Database\Factories;

use App\Models\Component;
use App\Models\Equipment;
use App\Models\Technician;
use Illuminate\Database\Eloquent\Factories\Factory;

class ServiceVisitFactory extends Factory
{
    public function definition(): array
    {
        return [
            'equipment_id' => Equipment::factory(),
            'technician_id' => Technician::factory(),
            'component_id' => Component::factory(),
            'type' => $this->faker->randomElement(['preventivo', 'preventivo', 'correctivo']),
            'visited_at' => $this->faker->dateTimeBetween('-90 days', 'now'),
            'pump_pressure_psi' => $this->faker->randomFloat(2, 150, 220),
            'dispensed_volume_liters' => $this->faker->randomFloat(2, 8, 25),
            'cycle_time_minutes' => $this->faker->randomFloat(2, 3, 12),
            'operating_hours' => $this->faker->randomFloat(2, 100, 5000),
            'notes' => null,
            'parts_used' => null,
        ];
    }
}
