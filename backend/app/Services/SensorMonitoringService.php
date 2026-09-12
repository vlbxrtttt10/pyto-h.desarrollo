<?php

namespace App\Services;

use App\Events\DashboardUpdated;
use App\Models\EquipmentAnomaly;
use App\Models\EquipmentComponent;
use App\Models\MaintenanceAlert;
use App\Models\SensorReading;

class SensorMonitoringService
{
    private const LOOKBACK_READINGS = 3;

    public function __construct(private TelegramNotifier $telegramNotifier)
    {
    }

    public function processReading(SensorReading $reading): SensorReading
    {
        $reading->load('equipmentComponent.component');

        $anomaly = $this->detectAnomaly($reading);

        if ($anomaly) {
            EquipmentAnomaly::create([
                'sensor_reading_id' => $reading->id,
                ...$anomaly,
            ]);

            $this->evaluateMaintenanceRisk($reading->equipment_component_id);
        }

        DashboardUpdated::dispatch('sensor_reading');

        return $reading->fresh(['equipmentAnomalies']);
    }

    private function detectAnomaly(SensorReading $reading): ?array
    {
        $component = $reading->equipmentComponent->component;

        $temperature = (float) $reading->temperature_celsius;
        $pressure = (float) $reading->pressure_psi;
        $grease = (float) $reading->grease_level_percent;

        $overheating = $temperature > (float) $component->max_temperature_celsius;
        $overpressure = $pressure > (float) $component->max_pressure_psi;
        $lowGrease = $grease < (float) $component->min_grease_level_percent;

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

    public function evaluateMaintenanceRisk(int $equipmentComponentId): void
    {
        $recentReadings = SensorReading::where('equipment_component_id', $equipmentComponentId)
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

        $equipmentId = EquipmentComponent::whereKey($equipmentComponentId)->value('equipment_id');

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

        if (! $wasAlreadyOpen || ! $alert->telegram_notified) {
            $this->telegramNotifier->sendMaintenanceAlert($alert);
        }
    }
}
