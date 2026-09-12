<?php

namespace App\Console\Commands;

use App\Events\DashboardUpdated;
use App\Events\EquipmentStoppedViaTelegram;
use App\Models\Equipment;
use App\Models\MaintenanceAlert;
use App\Services\TelegramNotifier;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class PollTelegramUpdates extends Command
{
    protected $signature = 'telegram:poll {--once : Consultar una sola vez y salir, en vez de correr en loop}';

    protected $description = 'Escucha las pulsaciones de botones del bot de Telegram (detener equipo) y actualiza el sistema.';

    private const OFFSET_CACHE_KEY = 'telegram_poll_offset';

    public function handle(TelegramNotifier $telegram): int
    {
        $this->info('Escuchando respuestas del bot de Telegram (Ctrl+C para detener)...');

        $offset = Cache::get(self::OFFSET_CACHE_KEY);

        do {
            $updates = $telegram->getUpdates($offset);

            foreach ($updates as $update) {
                $offset = $update['update_id'] + 1;
                Cache::forever(self::OFFSET_CACHE_KEY, $offset);

                $callback = $update['callback_query'] ?? null;
                if ($callback) {
                    $this->handleCallback($callback, $telegram);

                    continue;
                }

                $message = $update['message'] ?? null;
                if ($message) {
                    $this->handleMessage($message, $telegram);
                }
            }
        } while (! $this->option('once'));

        return self::SUCCESS;
    }

    private function handleMessage(array $message, TelegramNotifier $telegram): void
    {
        $text = trim($message['text'] ?? '');
        $chatId = $message['chat']['id'] ?? null;

        if (! $chatId || ! str_starts_with($text, '/status')) {
            return;
        }

        $code = trim(substr($text, strlen('/status')));

        if ($code === '') {
            $this->sendFleetStatus($chatId, $telegram);

            return;
        }

        $this->sendEquipmentStatus($chatId, $code, $telegram);
    }

    private function sendEquipmentStatus(int $chatId, string $code, TelegramNotifier $telegram): void
    {
        $equipment = Equipment::where('code', $code)->first();

        if (! $equipment) {
            $telegram->sendMessage($chatId, "No se encontro ningun equipo con el codigo <b>{$code}</b>.");

            return;
        }

        $lastReading = $equipment->sensorReadings()->latest('read_at')->first();
        $openAlerts = $equipment->maintenanceAlerts()->where('status', 'open')->get();

        $statusEmoji = match ($equipment->status) {
            'en_falla' => '🔴',
            'en_mantenimiento' => '🟡',
            default => '🟢',
        };

        $lines = [
            "{$statusEmoji} <b>{$equipment->code}</b> ({$equipment->model})",
            "Cliente: {$equipment->client}",
            'Sitio: '.($equipment->site ?: 'No especificado'),
            'Estado: '.strtoupper($equipment->status),
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

        $telegram->sendMessage($chatId, implode("\n", $lines));
    }

    private function sendFleetStatus(int $chatId, TelegramNotifier $telegram): void
    {
        $equipments = Equipment::withCount(['maintenanceAlerts as open_alerts_count' => fn ($q) => $q->where('status', 'open')])
            ->orderBy('code')
            ->get();

        if ($equipments->isEmpty()) {
            $telegram->sendMessage($chatId, 'No hay equipos registrados en el sistema.');

            return;
        }

        $lines = ['<b>Estado de la flota</b>', ''];

        foreach ($equipments as $equipment) {
            $statusEmoji = match ($equipment->status) {
                'en_falla' => '🔴',
                'en_mantenimiento' => '🟡',
                default => '🟢',
            };

            $lines[] = "{$statusEmoji} <b>{$equipment->code}</b> — ".strtoupper($equipment->status).
                ($equipment->open_alerts_count > 0 ? " ({$equipment->open_alerts_count} alerta/s abierta/s)" : '');
        }

        $lines[] = '';
        $lines[] = 'Escribe /status CODIGO para ver el detalle de un equipo.';

        $telegram->sendMessage($chatId, implode("\n", $lines));
    }

    private function handleCallback(array $callback, TelegramNotifier $telegram): void
    {
        $data = $callback['data'] ?? '';
        $message = $callback['message'] ?? null;

        if (! str_starts_with($data, 'stop_equipment:') || ! $message) {
            return;
        }

        $alertId = (int) substr($data, strlen('stop_equipment:'));
        $alert = MaintenanceAlert::with('equipment')->find($alertId);

        if (! $alert) {
            $telegram->answerCallbackQuery($callback['id'], 'Esta alerta ya no existe.');

            return;
        }

        if ($alert->status !== 'open') {
            $telegram->answerCallbackQuery($callback['id'], "Esta alerta ya fue atendida ({$alert->status}).");

            return;
        }

        $alert->equipment->update(['status' => 'en_falla']);
        $alert->update(['status' => 'acknowledged']);

        $telegram->answerCallbackQuery($callback['id'], "Equipo {$alert->equipment->code} marcado como detenido.");

        $telegram->markMessageAsHandled(
            $message['chat']['id'],
            $message['message_id'],
            $message['text'],
            "🛑 <b>Equipo detenido</b> — marcado como \"En falla\" en el sistema."
        );

        DashboardUpdated::dispatch('equipment_stopped_via_telegram');
        EquipmentStoppedViaTelegram::dispatch($alert);

        $this->info("Equipo {$alert->equipment->code} detenido a pedido de Telegram (alerta #{$alert->id}).");
    }
}
