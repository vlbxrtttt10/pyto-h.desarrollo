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

        if (! $chatId || ! str_starts_with($text, '/')) {
            return;
        }

        if (str_starts_with($text, '/cmds') || str_starts_with($text, '/start') || str_starts_with($text, '/help')) {
            $this->sendCommandMenu($chatId, $telegram);

            return;
        }

        if (str_starts_with($text, '/status')) {
            $code = trim(substr($text, strlen('/status')));

            if ($code === '') {
                $this->sendFleetStatus($chatId, $telegram);

                return;
            }

            $this->sendEquipmentStatus($chatId, $code, $telegram);

            return;
        }

        if (str_starts_with($text, '/parar')) {
            $code = trim(substr($text, strlen('/parar')));

            $this->askEmergencyStopConfirmation($chatId, $code, $telegram);
        }
    }

    private function askEmergencyStopConfirmation(int $chatId, string $code, TelegramNotifier $telegram): void
    {
        if ($code === '') {
            $telegram->sendMessage($chatId, 'Escribe el codigo del equipo. Ejemplo: <code>/parar ULM-001</code>');

            return;
        }

        $equipment = Equipment::where('code', $code)->first();

        if (! $equipment) {
            $telegram->sendMessage($chatId, "No se encontro ningun equipo con el codigo <b>{$code}</b>.");

            return;
        }

        if ($equipment->status === 'en_falla') {
            $telegram->sendMessage($chatId, "⚠️ El equipo <b>{$equipment->code}</b> ya esta detenido (En falla).");

            return;
        }

        $lines = [
            '🛑 <b>Confirmar parada de emergencia</b>',
            '',
            "Equipo: <b>{$equipment->code}</b> ({$equipment->model})",
            "Cliente: {$equipment->client}",
            'Estado actual: '.strtoupper($equipment->status),
            '',
            '¿Confirmas que quieres detener este equipo AHORA, sin que haya una anomalia detectada por el sistema?',
        ];

        $keyboard = [[
            ['text' => '🛑 Si, detener ahora', 'callback_data' => "confirm_stop:{$equipment->id}"],
            ['text' => '✖️ Cancelar', 'callback_data' => "cancel_stop:{$equipment->id}"],
        ]];

        $telegram->sendMessageWithButtons($chatId, implode("\n", $lines), $keyboard);
    }

    private function sendCommandMenu(int $chatId, TelegramNotifier $telegram): void
    {
        $totalEquipos = Equipment::count();
        $alertasAbiertas = MaintenanceAlert::where('status', 'open')->count();

        $lines = [
            '🔧 <b>HYDROMAQ BOT</b>',
            'Monitoreo de flota y sensores en tiempo real.',
            '',
            "📦 Equipos registrados: <b>{$totalEquipos}</b>",
            "🔔 Alertas abiertas: <b>{$alertasAbiertas}</b>",
            '',
            '👇 Elige una opcion o escribe /status CODIGO',
        ];

        $keyboard = [
            [
                ['text' => '📋 Flota completa', 'callback_data' => 'menu:flota'],
                ['text' => '🔴 En falla', 'callback_data' => 'menu:en_falla'],
            ],
            [
                ['text' => '🟡 En mantenimiento', 'callback_data' => 'menu:en_mantenimiento'],
                ['text' => '🟢 Operativos', 'callback_data' => 'menu:operativo'],
            ],
            [
                ['text' => '🔔 Alertas abiertas', 'callback_data' => 'menu:alertas'],
                ['text' => '❓ Ayuda', 'callback_data' => 'menu:ayuda'],
            ],
        ];

        $telegram->sendMessageWithButtons($chatId, implode("\n", $lines), $keyboard);
    }

    private function sendHelp(int $chatId, TelegramNotifier $telegram): void
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

        $telegram->sendMessage($chatId, implode("\n", $lines));
    }

    private function sendEquipmentsByStatus(int $chatId, string $status, TelegramNotifier $telegram): void
    {
        $titulos = [
            'en_falla' => ['🔴', 'En falla'],
            'en_mantenimiento' => ['🟡', 'En mantenimiento'],
            'operativo' => ['🟢', 'Operativos'],
        ];

        [$emoji, $titulo] = $titulos[$status];

        $equipments = Equipment::where('status', $status)
            ->withCount(['maintenanceAlerts as open_alerts_count' => fn ($q) => $q->where('status', 'open')])
            ->orderBy('code')
            ->get();

        if ($equipments->isEmpty()) {
            $telegram->sendMessage($chatId, "{$emoji} No hay equipos en estado <b>{$titulo}</b>.");

            return;
        }

        $lines = ["{$emoji} <b>{$titulo} ({$equipments->count()})</b>", ''];

        foreach ($equipments as $equipment) {
            $alertSuffix = $equipment->open_alerts_count > 0
                ? " ⚠️ {$equipment->open_alerts_count} alerta/s"
                : '';

            $lines[] = "• <b>{$equipment->code}</b> ({$equipment->model}) — {$equipment->client}{$alertSuffix}";
        }

        $telegram->sendMessage($chatId, implode("\n", $lines));
    }

    private function sendOpenAlerts(int $chatId, TelegramNotifier $telegram): void
    {
        $alerts = MaintenanceAlert::with('equipment')
            ->where('status', 'open')
            ->orderByDesc('created_at')
            ->get();

        if ($alerts->isEmpty()) {
            $telegram->sendMessage($chatId, '✅ No hay alertas abiertas en este momento.');

            return;
        }

        $lines = ["🔔 <b>Alertas abiertas ({$alerts->count()})</b>", ''];

        foreach ($alerts as $alert) {
            $riskEmoji = match ($alert->risk_level) {
                'critical' => '🔴',
                'high' => '🟠',
                'medium' => '🟡',
                default => '🟢',
            };

            $lines[] = "{$riskEmoji} <b>{$alert->equipment->code}</b> — {$alert->title} (riesgo ".strtoupper($alert->risk_level).')';
        }

        $telegram->sendMessage($chatId, implode("\n", $lines));
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

        $groups = [
            'en_falla' => ['emoji' => '🔴', 'titulo' => 'En falla', 'items' => []],
            'en_mantenimiento' => ['emoji' => '🟡', 'titulo' => 'En mantenimiento', 'items' => []],
            'operativo' => ['emoji' => '🟢', 'titulo' => 'Operativos', 'items' => []],
        ];

        foreach ($equipments as $equipment) {
            $key = isset($groups[$equipment->status]) ? $equipment->status : 'operativo';
            $groups[$key]['items'][] = $equipment;
        }

        $total = $equipments->count();
        $resumen = collect($groups)
            ->filter(fn ($g) => count($g['items']) > 0)
            ->map(fn ($g) => "{$g['emoji']} ".count($g['items']))
            ->implode('  ');

        $lines = [
            '📋 <b>Estado de la flota</b>',
            "Total: <b>{$total}</b> equipo/s  ·  {$resumen}",
        ];

        foreach ($groups as $group) {
            if (empty($group['items'])) {
                continue;
            }

            $lines[] = '';
            $lines[] = "{$group['emoji']} <b>{$group['titulo']} (".count($group['items']).')</b>';

            foreach ($group['items'] as $equipment) {
                $alertSuffix = $equipment->open_alerts_count > 0
                    ? " ⚠️ {$equipment->open_alerts_count} alerta/s"
                    : '';

                $lines[] = "  • <b>{$equipment->code}</b> ({$equipment->model}) — {$equipment->client}{$alertSuffix}";
            }
        }

        $lines[] = '';
        $lines[] = 'ℹ️ Escribe <b>/status CODIGO</b> para ver el detalle de un equipo.';

        $telegram->sendMessage($chatId, implode("\n", $lines));
    }

    private function handleMenuCallback(string $data, array $callback, array $message, TelegramNotifier $telegram): void
    {
        $chatId = $message['chat']['id'];
        $option = substr($data, strlen('menu:'));

        match ($option) {
            'flota' => $this->sendFleetStatus($chatId, $telegram),
            'en_falla', 'en_mantenimiento', 'operativo' => $this->sendEquipmentsByStatus($chatId, $option, $telegram),
            'alertas' => $this->sendOpenAlerts($chatId, $telegram),
            'ayuda' => $this->sendHelp($chatId, $telegram),
            default => null,
        };

        $telegram->answerCallbackQuery($callback['id'], '');
    }

    private function handleCallback(array $callback, TelegramNotifier $telegram): void
    {
        $data = $callback['data'] ?? '';
        $message = $callback['message'] ?? null;

        if (! $message) {
            return;
        }

        if (str_starts_with($data, 'menu:')) {
            $this->handleMenuCallback($data, $callback, $message, $telegram);

            return;
        }

        if (str_starts_with($data, 'confirm_stop:')) {
            $this->handleEmergencyStopConfirmed((int) substr($data, strlen('confirm_stop:')), $callback, $message, $telegram);

            return;
        }

        if (str_starts_with($data, 'cancel_stop:')) {
            $telegram->answerCallbackQuery($callback['id'], 'Parada de emergencia cancelada.');
            $telegram->markMessageAsHandled(
                $message['chat']['id'],
                $message['message_id'],
                $message['text'],
                '✖️ <b>Cancelado</b> — el equipo no fue detenido.'
            );

            return;
        }

        if (! str_starts_with($data, 'stop_equipment:')) {
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

        $alert->update(['status' => 'acknowledged']);

        $this->stopEquipmentAndNotify($alert, $callback['id'], $message, $telegram, 'Equipo {code} marcado como detenido.');
    }

    private function handleEmergencyStopConfirmed(int $equipmentId, array $callback, array $message, TelegramNotifier $telegram): void
    {
        $equipment = Equipment::find($equipmentId);

        if (! $equipment) {
            $telegram->answerCallbackQuery($callback['id'], 'Este equipo ya no existe.');

            return;
        }

        if ($equipment->status === 'en_falla') {
            $telegram->answerCallbackQuery($callback['id'], 'Este equipo ya estaba detenido.');

            return;
        }

        $alert = MaintenanceAlert::create([
            'equipment_id' => $equipment->id,
            'title' => 'Parada de emergencia manual',
            'description' => "Parada de emergencia solicitada manualmente por Telegram para el equipo {$equipment->code}, sin anomalia detectada por el sistema de sensores.",
            'recommended_action' => 'Verificar el equipo en sitio antes de reactivarlo.',
            'risk_level' => 'critical',
            'status' => 'acknowledged',
            'telegram_notified' => true,
        ]);

        $alert->setRelation('equipment', $equipment);

        $this->stopEquipmentAndNotify($alert, $callback['id'], $message, $telegram, '🛑 Equipo {code} detenido de emergencia.');
    }

    private function stopEquipmentAndNotify(MaintenanceAlert $alert, string $callbackQueryId, array $message, TelegramNotifier $telegram, string $confirmationTemplate): void
    {
        $alert->equipment->update(['status' => 'en_falla']);

        $confirmationText = str_replace('{code}', $alert->equipment->code, $confirmationTemplate);

        $telegram->answerCallbackQuery($callbackQueryId, $confirmationText);

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
