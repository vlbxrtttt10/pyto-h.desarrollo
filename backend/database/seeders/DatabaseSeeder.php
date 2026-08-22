<?php

namespace Database\Seeders;

use App\Models\HaulRoute;
use App\Models\HaulTrip;
use App\Models\ModulePermission;
use App\Models\Operator;
use App\Models\Truck;
use App\Models\User;
use App\Services\FuelIntelligenceService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(FuelIntelligenceService $fuelIntelligence): void
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
                'can_view' => true,
                'can_create' => true,
                'can_edit' => true,
                'can_delete' => true,
            ]);
        }

        $trucks = Truck::factory(8)->create();
        $operators = Operator::factory(12)->create();
        $routes = HaulRoute::factory(4)->create();

        // Uno de los camiones sera nuestro "caso de falla mecanica": sus ultimos
        // viajes cronologicos tendran sobreconsumo inexplicado por habitos.
        $faultyTruck = $trucks->first();

        foreach ($trucks as $truck) {
            $tripsForTruck = random_int(15, 25);

            // Fechas generadas en orden cronologico ascendente para que el ultimo
            // creado sea siempre el mas reciente (necesario para el analisis de riesgo mecanico).
            $dates = collect(range(0, $tripsForTruck - 1))
                ->map(fn ($i) => now()->subDays($tripsForTruck - $i)->subHours(random_int(0, 20)))
                ->sort()
                ->values();

            for ($i = 0; $i < $tripsForTruck; $i++) {
                $isRecent = $i >= $tripsForTruck - 6;
                $roll = random_int(1, 100);

                $state = match (true) {
                    $truck->is($faultyTruck) && $isRecent => 'unexplainedOverconsumption',
                    $roll <= 15 => 'excessiveIdling',
                    $roll <= 25 => 'harshDriving',
                    $roll <= 32 => 'wrongGearUsage',
                    default => 'normal',
                };

                $route = $routes->random();
                $startedAt = $dates[$i];
                $drivingMinutes = random_int(18, 45);

                $factory = HaulTrip::factory()
                    ->for($truck)
                    ->for($operators->random())
                    ->for($route, 'haulRoute')
                    ->state([
                        'started_at' => $startedAt,
                        'ended_at' => (clone $startedAt)->addMinutes($drivingMinutes),
                        'driving_minutes' => $drivingMinutes,
                    ]);

                $trip = match ($state) {
                    'excessiveIdling' => $factory->withExcessiveIdling()->create(),
                    'harshDriving' => $factory->withHarshDriving()->create(),
                    'wrongGearUsage' => $factory->withWrongGearUsage()->create(),
                    'unexplainedOverconsumption' => $factory->withUnexplainedOverconsumption()->create(),
                    default => $factory->create(),
                };

                // El consumo real simulado = consumo fisico base (segun ruta/carga/camion)
                // + el costo real de ralenti y eventos de mal habito registrados en el viaje
                // + ruido de medicion normal. Para el escenario de falla mecanica se aplica
                // ademas un sobreconsumo fuerte sin causa aparente en los habitos.
                $physicalBase = $fuelIntelligence->calculatePhysicalBaseFuel($trip);
                $habitCost = ($trip->idle_minutes * 0.9)
                    + (($trip->harsh_braking_events + $trip->harsh_acceleration_events) * 1.6)
                    + ($trip->wrong_gear_events * 2.2);

                $noise = random_int(-6, 6) / 100;
                $realistic = ($physicalBase + $habitCost) * (1 + $noise);

                if ($state === 'unexplainedOverconsumption') {
                    $realistic *= 1.75;
                }

                $trip->fuel_consumed_liters = round($realistic, 2);
                $trip->save();

                $fuelIntelligence->processTrip($trip);
            }
        }
    }
}
