<?php

namespace App\Services;

use App\Models\FuelAnomaly;
use App\Models\HaulTrip;
use App\Models\MechanicalAlert;
use Illuminate\Support\Facades\DB;

class FuelIntelligenceService
{
    /**
     * Litros quemados por minuto solo por tener el motor encendido sin avanzar.
     */
    private const IDLE_LITERS_PER_MINUTE = 0.9;

    /**
     * Minutos de ralenti considerados normales/tolerables (espera tipica en carguio/descarga).
     */
    private const NORMAL_IDLE_MINUTES = 5;

    /**
     * Litros extra por cada evento de frenado/aceleracion brusca o uso de marcha incorrecta
     * por encima del rango tolerable.
     */
    private const HARSH_EVENT_LITERS = 1.6;
    private const WRONG_GEAR_EVENT_LITERS = 2.2;

    /**
     * Cantidad de eventos de mal habito considerados normales/tolerables por viaje.
     */
    private const NORMAL_HARSH_EVENTS = 2;
    private const NORMAL_WRONG_GEAR_EVENTS = 1;

    /**
     * Factor multiplicativo de consumo por cada punto porcentual de pendiente positiva.
     */
    private const GRADE_PENALTY_FACTOR = 0.045;

    /**
     * Umbral de desviacion (%) sobre el cual se genera una anomalia.
     */
    private const ANOMALY_THRESHOLD_PERCENT = 15.0;

    /**
     * Precio de referencia del litro de diesel (moneda local), usado para estimar costo extra.
     */
    private const FUEL_PRICE_PER_LITER = 4.20;

    /**
     * Calcula el consumo de combustible fisico base (litros) para un viaje segun
     * el peso transportado, la distancia y la pendiente de la ruta. No incluye
     * ralenti ni malos habitos: es el "deberia gastar" bajo buenas practicas.
     */
    public function calculatePhysicalBaseFuel(HaulTrip $trip): float
    {
        $route = $trip->haulRoute;
        $truck = $trip->truck;

        $totalWeightTons = (float) $truck->empty_weight_tons + (float) $trip->payload_tons;

        $baseConsumption = (float) $route->base_liters_per_ton_km * $totalWeightTons * (float) $route->distance_km;

        // Penalizacion por pendiente (subidas incrementan el consumo de forma no lineal)
        $grade = (float) $route->average_grade_percent;
        if ($grade > 0) {
            $baseConsumption *= 1 + ($grade * self::GRADE_PENALTY_FACTOR);
        }

        return $baseConsumption;
    }

    /**
     * Consumo esperado tolerado: el consumo fisico base mas un margen normal de
     * ralenti en carguio/descarga. Es la referencia contra la que se compara el
     * consumo real para detectar anomalias.
     */
    public function calculateExpectedFuel(HaulTrip $trip): float
    {
        $expected = $this->calculatePhysicalBaseFuel($trip)
            + (self::NORMAL_IDLE_MINUTES * self::IDLE_LITERS_PER_MINUTE);

        return round($expected, 2);
    }

    /**
     * Procesa un viaje recien registrado: calcula el consumo esperado, la desviacion,
     * y si supera el umbral, genera la anomalia con su causa mas probable.
     */
    public function processTrip(HaulTrip $trip): HaulTrip
    {
        $trip->load(['truck', 'haulRoute']);

        $expected = $this->calculateExpectedFuel($trip);
        $actual = (float) $trip->fuel_consumed_liters;
        $deviation = $expected > 0 ? round((($actual - $expected) / $expected) * 100, 2) : 0.0;

        $trip->expected_fuel_liters = $expected;
        $trip->deviation_percent = $deviation;
        $trip->save();

        // Limpiar anomalias previas del viaje antes de recalcular (idempotente)
        $trip->fuelAnomalies()->delete();

        if ($deviation >= self::ANOMALY_THRESHOLD_PERCENT) {
            $this->recordAnomaly($trip, $actual - $expected, $deviation);
        }

        $this->evaluateMechanicalRisk($trip->truck_id);

        return $trip->fresh(['fuelAnomalies']);
    }

    /**
     * Determina la causa dominante de una desviacion positiva de combustible
     * y crea el registro de anomalia correspondiente.
     */
    private function recordAnomaly(HaulTrip $trip, float $extraLiters, float $deviationPercent): void
    {
        // Solo se atribuye a un habito el consumo generado por encima del rango normal/tolerable.
        $extraIdleMinutes = max(0, $trip->idle_minutes - self::NORMAL_IDLE_MINUTES);
        $extraHarshEvents = max(0, ($trip->harsh_braking_events + $trip->harsh_acceleration_events) - self::NORMAL_HARSH_EVENTS);
        $extraGearEvents = max(0, $trip->wrong_gear_events - self::NORMAL_WRONG_GEAR_EVENTS);

        $idleLiters = $extraIdleMinutes * self::IDLE_LITERS_PER_MINUTE;
        $harshLiters = $extraHarshEvents * self::HARSH_EVENT_LITERS;
        $gearLiters = $extraGearEvents * self::WRONG_GEAR_EVENT_LITERS;

        $causes = [
            'excessive_idling' => $idleLiters,
            'harsh_driving' => $harshLiters,
            'wrong_gear_usage' => $gearLiters,
        ];

        arsort($causes);
        $dominantCause = array_key_first($causes);
        $dominantValue = $causes[$dominantCause];

        // Si ninguno de los factores conocidos explica una porcion relevante de la desviacion,
        // se marca como posible falla mecanica (el patron no coincide con malos habitos).
        if ($dominantValue < ($extraLiters * 0.3)) {
            $dominantCause = 'possible_mechanical_fault';
        }

        $severity = match (true) {
            $deviationPercent >= 40 => 'high',
            $deviationPercent >= 25 => 'medium',
            default => 'low',
        };

        $explanations = [
            'excessive_idling' => sprintf(
                'El camion permanecio %d minutos en ralenti, quemando combustible sin producir.',
                $trip->idle_minutes
            ),
            'harsh_driving' => sprintf(
                'Se registraron %d eventos de frenado/aceleracion brusca durante el viaje.',
                $trip->harsh_braking_events + $trip->harsh_acceleration_events
            ),
            'wrong_gear_usage' => sprintf(
                'Se detectaron %d eventos de uso de marcha inadecuada en pendiente.',
                $trip->wrong_gear_events
            ),
            'possible_mechanical_fault' => 'La desviacion no se explica por habitos de conduccion conocidos; podria indicar una falla mecanica incipiente (inyectores, filtros, motor).',
        ];

        FuelAnomaly::create([
            'haul_trip_id' => $trip->id,
            'cause' => $dominantCause,
            'severity' => $severity,
            'extra_liters' => round($extraLiters, 2),
            'extra_cost' => round($extraLiters * self::FUEL_PRICE_PER_LITER, 2),
            'explanation' => $explanations[$dominantCause],
        ]);
    }

    /**
     * Revisa los ultimos viajes de un camion buscando una desviacion sostenida
     * que no se explique por malos habitos, lo cual sugiere una falla mecanica
     * incipiente. Genera o actualiza una alerta preventiva si corresponde.
     */
    public function evaluateMechanicalRisk(int $truckId, int $lookback = 5): void
    {
        $recentTrips = HaulTrip::where('truck_id', $truckId)
            ->whereNotNull('deviation_percent')
            ->orderByDesc('started_at')
            ->limit($lookback)
            ->get();

        if ($recentTrips->count() < $lookback) {
            return;
        }

        $mechanicalTripsCount = $recentTrips->filter(function (HaulTrip $trip) {
            return $trip->fuelAnomalies()->where('cause', 'possible_mechanical_fault')->exists();
        })->count();

        // Si la mayoria de los ultimos viajes muestran sospecha de falla mecanica,
        // se levanta (o refresca) una alerta preventiva para ese camion.
        if ($mechanicalTripsCount >= ceil($lookback * 0.6)) {
            $avgDeviation = round((float) $recentTrips->avg('deviation_percent'), 2);

            $riskLevel = match (true) {
                $avgDeviation >= 45 => 'critical',
                $avgDeviation >= 30 => 'high',
                default => 'medium',
            };

            MechanicalAlert::updateOrCreate(
                ['truck_id' => $truckId, 'status' => 'open'],
                [
                    'title' => 'Posible falla mecanica incipiente',
                    'description' => sprintf(
                        'El camion mostro sobreconsumo sostenido (%.1f%% promedio) en %d de sus ultimos %d viajes, '.
                        'sin que los habitos de conduccion expliquen la desviacion. Se recomienda inspeccion preventiva '.
                        'de inyectores, filtros de combustible y estado general del motor.',
                        $avgDeviation,
                        $mechanicalTripsCount,
                        $lookback
                    ),
                    'risk_level' => $riskLevel,
                    'consecutive_deviation_percent' => $avgDeviation,
                    'trips_considered' => $lookback,
                ]
            );
        }
    }

    /**
     * Ranking gamificado de operadores para un rango de fechas: menor desviacion
     * promedio y menos eventos de mal habito = mejor puesto (eco-conduccion).
     */
    public function operatorRanking(?string $from = null, ?string $to = null)
    {
        $query = HaulTrip::query()
            ->join('operators', 'operators.id', '=', 'haul_trips.operator_id')
            ->whereNotNull('haul_trips.deviation_percent');

        if ($from) {
            $query->where('haul_trips.started_at', '>=', $from);
        }
        if ($to) {
            $query->where('haul_trips.started_at', '<=', $to);
        }

        return $query
            ->select('operators.id', 'operators.name', 'operators.employee_code')
            ->selectRaw('COUNT(haul_trips.id) as trips_count')
            ->selectRaw('AVG(haul_trips.deviation_percent) as avg_deviation_percent')
            ->selectRaw('SUM(haul_trips.idle_minutes) as total_idle_minutes')
            ->selectRaw('SUM(haul_trips.harsh_braking_events + haul_trips.harsh_acceleration_events) as total_harsh_events')
            ->selectRaw('SUM(haul_trips.wrong_gear_events) as total_wrong_gear_events')
            ->groupBy('operators.id', 'operators.name', 'operators.employee_code')
            ->orderBy('avg_deviation_percent', 'asc')
            ->get();
    }
}
