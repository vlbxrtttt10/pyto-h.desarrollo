<?php

namespace Database\Seeders;

use App\Models\Component;
use App\Models\Equipment;
use App\Models\EquipmentComponent;
use App\Models\SensorReading;
use App\Services\SensorMonitoringService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(SensorMonitoringService $sensorMonitoring): void
    {
        $equipments = Equipment::factory(8)->create();
        $components = Component::factory(4)->create();

        $riskyInstallation = null;

        $installations = collect();
        foreach ($equipments as $equipment) {
            $installedComponents = $components->random(random_int(2, 4));

            foreach ($installedComponents as $component) {
                $installation = EquipmentComponent::create([
                    'equipment_id' => $equipment->id,
                    'component_id' => $component->id,
                    'installed_at' => now()->subMonths(random_int(3, 24)),
                ]);

                $installations->push($installation);
            }
        }

        $riskyInstallation = $installations->first();

        foreach ($installations as $installation) {
            $component = $components->firstWhere('id', $installation->component_id);
            $readingsForInstallation = random_int(6, 10);

            $dates = collect(range(0, $readingsForInstallation - 1))
                ->map(fn ($i) => now()->subDays(($readingsForInstallation - $i) * 12)->subHours(random_int(0, 20)))
                ->sort()
                ->values();

            for ($i = 0; $i < $readingsForInstallation; $i++) {
                $isRecent = $i >= $readingsForInstallation - 3;
                $roll = random_int(1, 100);

                $state = match (true) {
                    $installation->is($riskyInstallation) && $isRecent => 'overheating',
                    $roll <= 15 => 'lowGrease',
                    $roll <= 22 => 'overpressure',
                    default => 'normal',
                };

                $readAt = $dates[$i];

                $normalTemperature = $this->between((float) $component->min_temperature_celsius, (float) $component->max_temperature_celsius);
                $normalPressure = $this->between((float) $component->min_pressure_psi, (float) $component->max_pressure_psi);
                $normalGrease = $this->between((float) $component->min_grease_level_percent + 10, 95);

                $values = match ($state) {
                    'overheating' => [
                        'temperature_celsius' => round((float) $component->max_temperature_celsius * 1.3, 2),
                        'pressure_psi' => $normalPressure,
                        'grease_level_percent' => $normalGrease,
                    ],
                    'overpressure' => [
                        'temperature_celsius' => $normalTemperature,
                        'pressure_psi' => round((float) $component->max_pressure_psi * 1.2, 2),
                        'grease_level_percent' => $normalGrease,
                    ],
                    'lowGrease' => [
                        'temperature_celsius' => $normalTemperature,
                        'pressure_psi' => $normalPressure,
                        'grease_level_percent' => round((float) $component->min_grease_level_percent * 0.5, 2),
                    ],
                    default => [
                        'temperature_celsius' => $normalTemperature,
                        'pressure_psi' => $normalPressure,
                        'grease_level_percent' => $normalGrease,
                    ],
                };

                $reading = SensorReading::factory()
                    ->for($installation, 'equipmentComponent')
                    ->state([
                        'read_at' => $readAt,
                        ...$values,
                    ])
                    ->create();

                $sensorMonitoring->processReading($reading);
            }
        }
    }

    private function between(float $min, float $max): float
    {
        if ($min >= $max) {
            return round($min, 2);
        }

        return round($min + (mt_rand() / mt_getrandmax()) * ($max - $min), 2);
    }
}
