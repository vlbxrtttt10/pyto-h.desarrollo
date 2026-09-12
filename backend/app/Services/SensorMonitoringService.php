<?php

namespace App\Services;

use App\Events\DashboardUpdated;
use App\Models\EquipmentAnomaly;
use App\Models\MaintenanceAlert;
use App\Models\SensorReading;

class SensorMonitoringService
{
    /** Cuantas de las ultimas lecturas se evaluan para decidir si se abre una alerta de mantenimiento. */
    private const LOOKBACK_READINGS = 3;

    public function __construct(private TelegramNotifier $telegramNotifier)
    {
    }

    /**
     * Procesa una lectura de sensor recien recibida: evalua si esta fuera de
     * los rangos normales del componente y, de ser asi, registra una anomalia
     * y evalua si corresponde abrir una alerta de mantenimiento.
     */
    public function processReading(SensorReading $reading): SensorReading
    {
        $reading->load('component');

        $anomaly = $this->detectAnomaly($reading);

        if ($anomaly) {
            EquipmentAnomaly::create([
                'sensor_reading_id' => $reading->id,
                ...$anomaly,
            ]);

            $this->evaluateMaintenanceRisk($reading->equipment_id);
        }

        DashboardUpdated::dispatch('sensor_reading');

        return $reading->fresh(['equipmentAnomalies']);
    }

    /**
     * Compara la lectura contra los rangos normales del componente y determina
     * la causa mas relevante de anomalia, si existe. Devuelve null si la
     * lectura esta dentro de rango en los tres frentes.
     */
    private function detectAnomaly(SensorReading $reading): ?array
    {
        $component = $reading->component;

        $temperature = (float) $reading->temperature_celsius;
        $pressure = (float) $reading->pressure_psi;
        $grease = (float) $reading->grease_level_percent;

        $overheating = $temperature > (float) $component->max_temperature_celsius;
        $overpressure = $pressure > (float) $component->max_pressure_psi;
        $lowGrease = $grease < (float) $component->min_grease_level_percent;

        // Se prioriza la condicion mas critica cuando hay varias a la vez:
        // sobrepresion (riesgo de derrame/fuga inmediato) > sobrecalentamiento > bajo nivel de grasa.
        if ($overpressure) {
            $excess = $pressure - (float) $component->max_pressure_psi;
            $excessPercent = $component->max_pressure_psi > 0
                ? round(($excess / (float) $component->max_pressure_psi) * 100, 1)
                : 0;

            return [
                'cause' => 'overpressure',
                'severity' => $this->severityFromExcessPercent($excessPercent),
                'estimated_downtime_hours' => $this->downtimeFromExcessPercent($excessPercent),
                'explanation' => sprintf(
                    'Presion de %.1f PSI, %.1f%% por encima del maximo normal (%.1f PSI). Riesgo de fuga o derrame de grasa por exceso de presion.',
                    $pressure,
                    $excessPercent,
                    $component->max_pressure_psi
                ),
            ];
        }

        if ($overheating) {
            $excess = $temperature - (float) $component->max_temperature_celsius;
            $excessPercent = $component->max_temperature_celsius > 0
                ? round(($excess / (float) $component->max_temperature_celsius) * 100, 1)
                : 0;

            return [
                'cause' => 'overheating',
                'severity' => $this->severityFromExcessPercent($excessPercent),
                'estimated_downtime_hours' => $this->downtimeFromExcessPercent($excessPercent),
                'explanation' => sprintf(
                    'Temperatura de %.1f°C, %.1f%% por encima del maximo normal (%.1f°C). Posible falla de refrigeracion o desgaste del componente.',
                    $temperature,
                    $excessPercent,
                    $component->max_temperature_celsius
                ),
            ];
        }

        if ($lowGrease) {
            $deficit = (float) $component->min_grease_level_percent - $grease;
            $deficitPercent = $component->min_grease_level_percent > 0
                ? round(($deficit / (float) $component->min_grease_level_percent) * 100, 1)
                : 0;

            return [
                'cause' => 'low_grease_level',
                'severity' => $this->severityFromExcessPercent($deficitPercent),
                'estimated_downtime_hours' => $this->downtimeFromExcessPercent($deficitPercent),
                'explanation' => sprintf(
                    'Nivel de grasa en %.1f%%, por debajo del minimo normal (%.1f%%). Riesgo de friccion excesiva sin lubricacion suficiente.',
                    $grease,
                    $component->min_grease_level_percent
                ),
            ];
        }

        return null;
    }

    private function severityFromExcessPercent(float $excessPercent): string
    {
        return match (true) {
            $excessPercent >= 30 => 'high',
            $excessPercent >= 10 => 'medium',
            default => 'low',
        };
    }

    private function downtimeFromExcessPercent(float $excessPercent): float
    {
        return match (true) {
            $excessPercent >= 30 => 24.0,
            $excessPercent >= 10 => 8.0,
            default => 2.0,
        };
    }

    /**
     * Si la mayoria de las ultimas lecturas de un equipo presentan anomalias,
     * se abre (o refresca) una alerta de mantenimiento preventiva.
     */
    public function evaluateMaintenanceRisk(int $equipmentId): void
    {
        $recentReadings = SensorReading::where('equipment_id', $equipmentId)
            ->orderByDesc('read_at')
            ->limit(self::LOOKBACK_READINGS)
            ->get();

        if ($recentReadings->count() < self::LOOKBACK_READINGS) {
            return;
        }

        $anomalousReadings = $recentReadings->filter(function (SensorReading $reading) {
            return $reading->equipmentAnomalies()->exists();
        });

        $anomalousCount = $anomalousReadings->count();

        if ($anomalousCount < ceil(self::LOOKBACK_READINGS * 0.6)) {
            return;
        }

        $worstSeverity = $anomalousReadings
            ->flatMap(fn (SensorReading $reading) => $reading->equipmentAnomalies)
            ->pluck('severity');

        $riskLevel = match (true) {
            $worstSeverity->contains('high') => 'critical',
            $worstSeverity->filter(fn ($s) => $s === 'medium')->count() >= 2 => 'high',
            default => 'medium',
        };

        $recommendedActions = [
            'critical' => 'Detener el equipo y programar inspeccion inmediata. Riesgo de falla mayor o derrame.',
            'high' => 'Agendar visita preventiva dentro de los proximos 7 dias.',
            'medium' => 'Incluir el equipo en la proxima ronda de mantenimiento preventivo programado.',
        ];

        $causesDescription = $anomalousReadings
            ->flatMap(fn (SensorReading $reading) => $reading->equipmentAnomalies)
            ->pluck('cause')
            ->unique()
            ->implode(', ');

        $wasAlreadyOpen = MaintenanceAlert::where('equipment_id', $equipmentId)->where('status', 'open')->exists();

        $alert = MaintenanceAlert::updateOrCreate(
            ['equipment_id' => $equipmentId, 'status' => 'open'],
            [
                'title' => 'Falla detectada por sensores en equipo de campo',
                'description' => sprintf(
                    'El equipo presento anomalias en %d de sus ultimas %d lecturas de sensor (%s). '.
                    'Esto sugiere una condicion de riesgo sostenida que requiere atencion.',
                    $anomalousCount,
                    self::LOOKBACK_READINGS,
                    $causesDescription
                ),
                'recommended_action' => $recommendedActions[$riskLevel],
                'risk_level' => $riskLevel,
                'readings_considered' => self::LOOKBACK_READINGS,
            ]
        );

        // Se notifica por Telegram cuando la alerta es nueva, o cuando ya
        // existia pero el nivel de riesgo escalo y aun no se habia avisado.
        if (! $wasAlreadyOpen || ! $alert->telegram_notified) {
            $this->telegramNotifier->sendMaintenanceAlert($alert);
        }
    }
}
