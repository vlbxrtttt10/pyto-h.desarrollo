<?php

namespace Database\Seeders;

use App\Models\Component;
use App\Models\Equipment;
use App\Models\ModulePermission;
use App\Models\ServiceVisit;
use App\Models\Technician;
use App\Models\User;
use App\Services\MaintenanceIntelligenceService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(MaintenanceIntelligenceService $maintenanceIntelligence): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin Aleri',
            'email' => 'admin@aleri.mining',
            'is_super_admin' => true,
        ]);

        foreach (array_keys(ModulePermission::MODULES) as $module) {
            ModulePermission::create([
                'user_id' => $admin->id,
                'module' => $module,
                'can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => true,
            ]);
        }

        $equipments = Equipment::factory(8)->create();
        $technicians = Technician::factory(6)->create();
        $components = Component::factory(4)->create();

        // Uno de los equipos sera nuestro "caso de riesgo": sus ultimas visitas
        // cronologicas mostraran degradacion sostenida (caida de presion).
        $riskyEquipment = $equipments->first();

        foreach ($equipments as $equipment) {
            $visitsForEquipment = random_int(6, 10);

            // Fechas generadas en orden cronologico ascendente para que la ultima
            // creada sea siempre la mas reciente (necesario para el analisis de riesgo).
            $dates = collect(range(0, $visitsForEquipment - 1))
                ->map(fn ($i) => now()->subDays(($visitsForEquipment - $i) * 12)->subHours(random_int(0, 20)))
                ->sort()
                ->values();

            for ($i = 0; $i < $visitsForEquipment; $i++) {
                $isRecent = $i >= $visitsForEquipment - 3;
                $roll = random_int(1, 100);

                $state = match (true) {
                    $equipment->is($riskyEquipment) && $isRecent => 'pressureDrop',
                    $roll <= 15 => 'volumeMismatch',
                    $roll <= 22 => 'leakPattern',
                    default => 'normal',
                };

                $component = $components->random();
                $visitedAt = $dates[$i];

                // Ruido normal (+/-5%) alrededor de lo esperado para el componente,
                // asi una visita "normal" no dispara el umbral de anomalia por azar.
                $noise = fn (float $expected) => $expected * (1 + random_int(-5, 5) / 100);

                $factory = ServiceVisit::factory()
                    ->for($equipment)
                    ->for($technicians->random())
                    ->for($component, 'component')
                    ->state([
                        'visited_at' => $visitedAt,
                        'type' => $i === 0 ? 'instalacion' : 'preventivo',
                        'pump_pressure_psi' => round($noise((float) $component->expected_pressure_psi), 2),
                        'dispensed_volume_liters' => round($noise((float) $component->expected_volume_liters), 2),
                        'cycle_time_minutes' => round($noise((float) $component->expected_cycle_minutes), 2),
                    ]);

                $visit = match ($state) {
                    'volumeMismatch' => $factory->state([
                        'dispensed_volume_liters' => round((float) $component->expected_volume_liters * 1.7, 2),
                    ])->create(),
                    'leakPattern' => $factory->state([
                        'pump_pressure_psi' => round((float) $component->expected_pressure_psi * 0.6, 2),
                        'dispensed_volume_liters' => round((float) $component->expected_volume_liters * 1.7, 2),
                    ])->create(),
                    'pressureDrop' => $factory->state([
                        'pump_pressure_psi' => round((float) $component->expected_pressure_psi * 0.6, 2),
                    ])->create(),
                    default => $factory->create(),
                };

                $maintenanceIntelligence->processVisit($visit);
            }
        }
    }
}
