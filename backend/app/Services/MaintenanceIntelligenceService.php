<?php

namespace App\Services;

use App\Models\EquipmentAnomaly;
use App\Models\MaintenanceAlert;
use App\Models\ServiceVisit;

class MaintenanceIntelligenceService
{
    /** Umbral de desviacion (%) sobre el cual se genera una anomalia. */
    private const ANOMALY_THRESHOLD_PERCENT = 15.0;

    /** Peso de cada lectura en el calculo de la desviacion combinada. */
    private const PRESSURE_WEIGHT = 0.5;
    private const VOLUME_WEIGHT = 0.3;
    private const CYCLE_TIME_WEIGHT = 0.2;

    public function processVisit(ServiceVisit $visit): ServiceVisit
    {
        $visit->load('component');

        $deviation = $this->calculateDeviation($visit);

        $visit->deviation_percent = $deviation;
        $visit->save();

        // Limpiar anomalias previas de la visita antes de recalcular (idempotente)
        $visit->equipmentAnomalies()->delete();

        if ($deviation >= self::ANOMALY_THRESHOLD_PERCENT) {
            $this->recordAnomaly($visit, $deviation);
        }

        $this->evaluateMaintenanceRisk($visit->equipment_id);

        return $visit->fresh(['equipmentAnomalies']);
    }

    /**
     * Combina la desviacion de presion, volumen y tiempo de ciclo respecto a lo
     * esperado para el componente, cada una con su propio peso, en un solo
     * porcentaje de desviacion para la visita.
     */
    public function calculateDeviation(ServiceVisit $visit): float
    {
        $component = $visit->component;

        $pressureDeviation = $this->percentDeviation((float) $visit->pump_pressure_psi, (float) $component->expected_pressure_psi);
        $volumeDeviation = $this->percentDeviation((float) $visit->dispensed_volume_liters, (float) $component->expected_volume_liters);
        $cycleDeviation = $this->percentDeviation((float) $visit->cycle_time_minutes, (float) $component->expected_cycle_minutes);

        $combined = ($pressureDeviation * self::PRESSURE_WEIGHT)
            + ($volumeDeviation * self::VOLUME_WEIGHT)
            + ($cycleDeviation * self::CYCLE_TIME_WEIGHT);

        return round($combined, 2);
    }

    private function percentDeviation(float $actual, float $expected): float
    {
        if ($expected <= 0) {
            return 0.0;
        }

        return abs(($actual - $expected) / $expected) * 100;
    }

    private function recordAnomaly(ServiceVisit $visit, float $deviationPercent): void
    {
        $component = $visit->component;

        $pressureGap = $this->percentDeviation((float) $visit->pump_pressure_psi, (float) $component->expected_pressure_psi);
        $volumeGap = $this->percentDeviation((float) $visit->dispensed_volume_liters, (float) $component->expected_volume_liters);
        $cycleGap = $this->percentDeviation((float) $visit->cycle_time_minutes, (float) $component->expected_cycle_minutes);

        $causes = [
            'pressure_drop' => $pressureGap,
            'volume_mismatch' => $volumeGap,
            'cycle_time_increase' => $cycleGap,
        ];

        arsort($causes);
        $dominantCause = array_key_first($causes);
        $dominantValue = $causes[$dominantCause];

        // Si la caida de presion y el desajuste de volumen son ambos altos a la
        // vez, el patron es tipico de una fuga en el sistema.
        if ($pressureGap >= self::ANOMALY_THRESHOLD_PERCENT && $volumeGap >= self::ANOMALY_THRESHOLD_PERCENT) {
            $dominantCause = 'possible_leak';
        } elseif ($dominantValue < self::ANOMALY_THRESHOLD_PERCENT) {
            $dominantCause = 'unknown';
        }

        $severity = match (true) {
            $deviationPercent >= 40 => 'high',
            $deviationPercent >= 25 => 'medium',
            default => 'low',
        };

        $estimatedDowntimeHours = match ($severity) {
            'high' => 24.0,
            'medium' => 8.0,
            default => 2.0,
        };

        $explanations = [
            'pressure_drop' => sprintf(
                'La presion de la bomba (%.1f PSI) se desvio %.1f%% de lo esperado (%.1f PSI), posible desgaste.',
                $visit->pump_pressure_psi,
                $pressureGap,
                $component->expected_pressure_psi
            ),
            'volume_mismatch' => sprintf(
                'El volumen dispensado (%.1f L) se desvio %.1f%% de lo esperado (%.1f L) para este componente.',
                $visit->dispensed_volume_liters,
                $volumeGap,
                $component->expected_volume_liters
            ),
            'cycle_time_increase' => sprintf(
                'El tiempo de ciclo (%.1f min) se alargo %.1f%% respecto al esperado (%.1f min).',
                $visit->cycle_time_minutes,
                $cycleGap,
                $component->expected_cycle_minutes
            ),
            'possible_leak' => 'Caida de presion combinada con desajuste de volumen: patron tipico de una fuga en el sistema.',
            'unknown' => 'La desviacion no se explica claramente por un unico factor; se recomienda inspeccion general.',
        ];

        EquipmentAnomaly::create([
            'service_visit_id' => $visit->id,
            'cause' => $dominantCause,
            'severity' => $severity,
            'estimated_downtime_hours' => $estimatedDowntimeHours,
            'explanation' => $explanations[$dominantCause],
        ]);
    }

    public function evaluateMaintenanceRisk(int $equipmentId, int $lookback = 3): void
    {
        $recentVisits = ServiceVisit::where('equipment_id', $equipmentId)
            ->whereNotNull('deviation_percent')
            ->orderByDesc('visited_at')
            ->limit($lookback)
            ->get();

        if ($recentVisits->count() < $lookback) {
            return;
        }

        $anomalousVisitsCount = $recentVisits->filter(function (ServiceVisit $visit) {
            return $visit->equipmentAnomalies()->exists();
        })->count();

        // Si la mayoria de las ultimas visitas muestran anomalias, se levanta
        // (o refresca) una alerta preventiva para ese equipo.
        if ($anomalousVisitsCount >= ceil($lookback * 0.6)) {
            $avgDeviation = round((float) $recentVisits->avg('deviation_percent'), 2);

            $riskLevel = match (true) {
                $avgDeviation >= 45 => 'critical',
                $avgDeviation >= 30 => 'high',
                default => 'medium',
            };

            $recommendedActions = [
                'critical' => 'Programar visita preventiva inmediata con repuestos de bomba y sellos en mano.',
                'high' => 'Agendar visita preventiva dentro de los proximos 7 dias.',
                'medium' => 'Incluir el equipo en la proxima ronda de mantenimiento preventivo programado.',
            ];

            MaintenanceAlert::updateOrCreate(
                ['equipment_id' => $equipmentId, 'status' => 'open'],
                [
                    'title' => 'Riesgo de falla en equipo de lubricacion/hidraulica',
                    'description' => sprintf(
                        'El equipo mostro desviacion sostenida (%.1f%% promedio) en %d de sus ultimas %d visitas, '.
                        'lo cual sugiere degradacion progresiva de un componente critico. Se recomienda inspeccion preventiva.',
                        $avgDeviation,
                        $anomalousVisitsCount,
                        $lookback
                    ),
                    'recommended_action' => $recommendedActions[$riskLevel],
                    'risk_level' => $riskLevel,
                    'consecutive_deviation_percent' => $avgDeviation,
                    'visits_considered' => $lookback,
                ]
            );
        }
    }

    public function technicianRanking(?string $from = null, ?string $to = null)
    {
        $query = ServiceVisit::query()
            ->join('technicians', 'technicians.id', '=', 'service_visits.technician_id')
            ->whereNotNull('service_visits.deviation_percent');

        if ($from) {
            $query->where('service_visits.visited_at', '>=', $from);
        }
        if ($to) {
            $query->where('service_visits.visited_at', '<=', $to);
        }

        return $query
            ->select('technicians.id', 'technicians.name', 'technicians.employee_code')
            ->selectRaw('COUNT(service_visits.id) as visits_count')
            ->selectRaw('AVG(service_visits.deviation_percent) as avg_deviation_percent')
            ->groupBy('technicians.id', 'technicians.name', 'technicians.employee_code')
            ->orderBy('avg_deviation_percent', 'asc')
            ->get();
    }
}
