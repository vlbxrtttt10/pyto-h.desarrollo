<?php

namespace Database\Factories;

use App\Models\HaulRoute;
use App\Models\Operator;
use App\Models\Truck;
use Illuminate\Database\Eloquent\Factories\Factory;

class HaulTripFactory extends Factory
{
    public function definition(): array
    {
        $startedAt = $this->faker->dateTimeBetween('-30 days', 'now');
        $drivingMinutes = $this->faker->numberBetween(18, 45);
        $endedAt = (clone $startedAt)->modify("+{$drivingMinutes} minutes");

        return [
            'truck_id' => Truck::factory(),
            'operator_id' => Operator::factory(),
            'haul_route_id' => HaulRoute::factory(),
            'started_at' => $startedAt,
            'ended_at' => $endedAt,
            'payload_tons' => $this->faker->randomFloat(2, 180, 320),
            'idle_minutes' => $this->faker->numberBetween(0, 6),
            'driving_minutes' => $drivingMinutes,
            'harsh_braking_events' => $this->faker->numberBetween(0, 2),
            'harsh_acceleration_events' => $this->faker->numberBetween(0, 2),
            'wrong_gear_events' => $this->faker->numberBetween(0, 1),
            'avg_speed_kmh' => $this->faker->randomFloat(2, 18, 35),
            // Placeholder: el seeder recalcula este valor con base en el consumo
            // esperado real (segun ruta/carga/camion) antes de persistir el viaje.
            'fuel_consumed_liters' => $this->faker->randomFloat(2, 40, 70),
        ];
    }

    /**
     * Viaje con mal habito marcado de ralenti excesivo.
     */
    public function withExcessiveIdling(): static
    {
        return $this->state(fn () => [
            'idle_minutes' => $this->faker->numberBetween(18, 35),
        ]);
    }

    /**
     * Viaje con conduccion agresiva (frenado/aceleracion brusca).
     */
    public function withHarshDriving(): static
    {
        return $this->state(fn () => [
            'harsh_braking_events' => $this->faker->numberBetween(4, 8),
            'harsh_acceleration_events' => $this->faker->numberBetween(3, 7),
        ]);
    }

    /**
     * Viaje con uso incorrecto de marchas en pendiente.
     */
    public function withWrongGearUsage(): static
    {
        return $this->state(fn () => [
            'wrong_gear_events' => $this->faker->numberBetween(3, 6),
        ]);
    }

    /**
     * Viaje con sobreconsumo inexplicado por habitos (patron de falla mecanica).
     * Sin eventos de mal habito, para que el motor de IA no le pueda atribuir
     * la desviacion a ralenti/frenado/marchas.
     */
    public function withUnexplainedOverconsumption(): static
    {
        return $this->state(fn () => [
            'idle_minutes' => $this->faker->numberBetween(0, 3),
            'harsh_braking_events' => 0,
            'harsh_acceleration_events' => 0,
            'wrong_gear_events' => 0,
        ]);
    }
}
