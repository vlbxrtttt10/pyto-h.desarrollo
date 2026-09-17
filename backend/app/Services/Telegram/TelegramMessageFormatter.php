<?php

namespace App\Services\Telegram;

use App\Models\Equipment;
use App\Models\MaintenanceAlert;
use Illuminate\Support\Collection;

class TelegramMessageFormatter
{
    private const STATUS_GROUPS = [
        'en_falla' => ['emoji' => '🔴', 'titulo' => 'En falla'],
        'paro_emergencia' => ['emoji' => '🛑', 'titulo' => 'Paro de emergencia'],
        'en_mantenimiento' => ['emoji' => '🟡', 'titulo' => 'En mantenimiento'],
        'operativo' => ['emoji' => '🟢', 'titulo' => 'Operativos'],
    ];

    public function statusEmoji(string $status): string
    {
        return self::STATUS_GROUPS[$status]['emoji'] ?? self::STATUS_GROUPS['operativo']['emoji'];
    }

    public function statusLabel(string $status): string
    {
        return self::STATUS_GROUPS[$status]['titulo'] ?? ucfirst($status);
    }

    public function riskEmoji(string $riskLevel): string
    {
        return match ($riskLevel) {
            'critical' => '🔴',
            'high' => '🟠',
            'medium' => '🟡',
            default => '🟢',
        };
    }

    public function equipmentLine(Equipment $equipment, int $openAlertsCount = 0): string
    {
        $alertSuffix = $openAlertsCount > 0 ? " ⚠️ {$openAlertsCount} alerta/s" : '';

        return "<b>{$equipment->code}</b> ({$equipment->model}) — {$equipment->client}{$alertSuffix}";
    }

    public function fleetStatus(Collection $equipments): string
    {
        if ($equipments->isEmpty()) {
            return 'No hay equipos registrados en el sistema.';
        }

        $groups = collect(self::STATUS_GROUPS)->map(fn () => collect())->all();

        foreach ($equipments as $equipment) {
            $key = array_key_exists($equipment->status, $groups) ? $equipment->status : 'operativo';
            $groups[$key]->push($equipment);
        }

        $resumen = collect($groups)
            ->filter(fn ($items) => $items->isNotEmpty())
            ->map(fn ($items, $status) => self::STATUS_GROUPS[$status]['emoji'].' '.$items->count())
            ->implode('  ');

        $lines = [
            '📋 <b>Estado de la flota</b>',
            "Total: <b>{$equipments->count()}</b> equipo/s  ·  {$resumen}",
        ];

        foreach ($groups as $status => $items) {
            if ($items->isEmpty()) {
                continue;
            }

            $emoji = self::STATUS_GROUPS[$status]['emoji'];
            $titulo = self::STATUS_GROUPS[$status]['titulo'];

            $lines[] = '';
            $lines[] = "{$emoji} <b>{$titulo} ({$items->count()})</b>";

            foreach ($items as $equipment) {
                $lines[] = '  • '.$this->equipmentLine($equipment, $equipment->open_alerts_count ?? 0);
            }
        }

        $lines[] = '';
        $lines[] = 'ℹ️ Escribe <b>/status CODIGO</b> para ver el detalle de un equipo.';

        return implode("\n", $lines);
    }

    public function equipmentsByStatus(string $status, Collection $equipments): string
    {
        $emoji = $this->statusEmoji($status);
        $titulo = $this->statusLabel($status);

        if ($equipments->isEmpty()) {
            return "{$emoji} No hay equipos en estado <b>{$titulo}</b>.";
        }

        $lines = ["{$emoji} <b>{$titulo} ({$equipments->count()})</b>", ''];

        foreach ($equipments as $equipment) {
            $lines[] = '• '.$this->equipmentLine($equipment, $equipment->open_alerts_count ?? 0);
        }

        return implode("\n", $lines);
    }

    public function equipmentDetail(Equipment $equipment): string
    {
        $lastReading = $equipment->sensorReadings()->latest('read_at')->first();
        $openAlerts = $equipment->maintenanceAlerts()->where('status', 'open')->get();

        $lines = [
            "{$this->statusEmoji($equipment->status)} <b>{$equipment->code}</b> ({$equipment->model})",
            "Cliente: {$equipment->client}",
            'Sitio: '.($equipment->site ?: 'No especificado'),
            'Estado: '.strtoupper($this->statusLabel($equipment->status)),
        ];

        if ($lastReading) {
            $lines[] = '';
            $lines[] = '<b>Ultima lectura:</b> '.$lastReading->read_at->format('d/m/Y H:i');
            $lines[] = sprintf(
                'Temp: %.1f°C · Presion: %.1f PSI · Grasa: %.1f%%',
                $lastReading->temperature_celsius,
                $lastReading->pressure_psi,
                $lastReading->grease_level_percent
            );
        } else {
            $lines[] = '';
            $lines[] = 'Sin lecturas de sensor registradas todavia.';
        }

        if ($openAlerts->isNotEmpty()) {
            $lines[] = '';
            $lines[] = '<b>Alertas abiertas:</b> '.$openAlerts->count();
            foreach ($openAlerts as $alert) {
                $lines[] = "- {$alert->title} (riesgo ".strtoupper($alert->risk_level).')';
            }
        } else {
            $lines[] = '';
            $lines[] = 'Sin alertas abiertas.';
        }

        return implode("\n", $lines);
    }

    public function openAlertsList(Collection $alerts): string
    {
        if ($alerts->isEmpty()) {
            return '✅ No hay alertas abiertas en este momento.';
        }

        $lines = ["🔔 <b>Alertas abiertas ({$alerts->count()})</b>", ''];

        foreach ($alerts as $alert) {
            $emoji = $this->riskEmoji($alert->risk_level);
            $lines[] = "{$emoji} <b>{$alert->equipment->code}</b> — {$alert->title} (riesgo ".strtoupper($alert->risk_level).')';
        }

        return implode("\n", $lines);
    }

    public function emergencyStopConfirmation(Equipment $equipment): string
    {
        $lines = [
            '🛑 <b>Confirmar parada de emergencia</b>',
            '',
            "Equipo: <b>{$equipment->code}</b> ({$equipment->model})",
            "Cliente: {$equipment->client}",
            'Estado actual: '.strtoupper($equipment->status),
            '',
            '¿Confirmas que quieres detener este equipo AHORA, sin que haya una anomalia detectada por el sistema?',
        ];

        return implode("\n", $lines);
    }

    public function commandMenu(int $totalEquipos, int $alertasAbiertas): string
    {
        $lines = [
            '🔧 <b>HYDROMAQ BOT</b>',
            'Monitoreo de flota y sensores en tiempo real.',
            '',
            "📦 Equipos registrados: <b>{$totalEquipos}</b>",
            "🔔 Alertas abiertas: <b>{$alertasAbiertas}</b>",
            '',
            '👇 Elige una opcion o escribe /status CODIGO',
        ];

        return implode("\n", $lines);
    }

    public function help(): string
    {
        $lines = [
            '🤖 <b>Comandos disponibles</b>',
            '',
            '📋 <b>/status</b>',
            'Muestra el estado de toda la flota, agrupado por En falla, En mantenimiento y Operativos.',
            '',
            '🔎 <b>/status CODIGO</b>',
            'Muestra el detalle de un equipo puntual: cliente, sitio, ultima lectura de sensores y alertas abiertas.',
            'Ejemplo: <code>/status ULM-001</code>',
            '',
            '🛑 <b>Boton "Detener equipo"</b>',
            'Cuando llega una alerta de mantenimiento, puedes tocar el boton en el mensaje para marcar el equipo como "En falla" al instante.',
            '',
            '🆘 <b>/parar CODIGO</b>',
            'Parada de emergencia manual: detiene un equipo al instante aunque el sistema no haya detectado ninguna anomalia. Pide confirmacion antes de ejecutar.',
            'Ejemplo: <code>/parar ULM-001</code>',
            '',
            '❓ <b>/cmds</b>',
            'Vuelve a mostrar el menu principal.',
        ];

        return implode("\n", $lines);
    }
}
