<?php

namespace Database\Seeders;

use App\Models\Component;
use App\Models\Equipment;
use App\Models\SensorReading;
use App\Services\SensorMonitoringService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Genera flota, componentes y lecturas de ejemplo para demos/pruebas. No se
 * ejecuta automaticamente con migrate:fresh --seed; se corre a demanda con:
 * php artisan db:seed --class=DemoDataSeeder
 */
class DemoDataSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(SensorMonitoringService $sensorMonitoring): void
    {
        $equipments = Equipment::factory(8)->create();
        $components = Component::factory(4)->create();

        // Uno de los equipos sera nuestro "caso de riesgo": sus ultimas lecturas
        // cronologicas mostraran sobrecalentamiento sostenido.
        $riskyEquipment = $equipments->first();

        foreach ($equipments as $equipment) {
            $readingsForEquipment = random_int(6, 10);

            // Fechas generadas en orden cronologico ascendente para que la ultima
            // creada sea siempre la mas reciente (necesario para el analisis de riesgo).
            $dates = collect(range(0, $readingsForEquipment - 1))
                ->map(fn ($i) => now()->subDays(($readingsForEquipment - $i) * 12)->subHours(random_int(0, 20)))
                ->sort()
                ->values();

            for ($i = 0; $i < $readingsForEquipment; $i++) {
                $isRecent = $i >= $readingsForEquipment - 3;
                $roll = random_int(1, 100);

                $state = match (true) {
                    $equipment->is($riskyEquipment) && $isRecent => 'overheating',
                    $roll <= 15 => 'lowGrease',
                    $roll <= 22 => 'overpressure',
                    default => 'normal',
                };

                $component = $components->random();
                $readAt = $dates[$i];

                // Ruido normal dentro del rango del componente, asi una lectura
                // "normal" no dispara el umbral de anomalia por azar.
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
                    ->for($equipment)
                    ->for($component, 'component')
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
