<?php

namespace App\Console\Commands;

use App\Events\DashboardUpdated;
use App\Models\MaintenanceAlert;
use App\Services\TelegramNotifier;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class PollTelegramUpdates extends Command
{
    /**
     * Corre en loop preguntando a la API de Telegram por respuestas nuevas
     * (pulsaciones de botones), ya que en este entorno local no hay una URL
     * publica a la que Telegram pueda llamar via webhook.
     */
    protected $signature = 'telegram:poll {--once : Consultar una sola vez y salir, en vez de correr en loop}';

    protected $description = 'Escucha las pulsaciones de botones del bot de Telegram (detener equipo) y actualiza el sistema.';

    /** Clave de cache donde se persiste el ultimo update_id procesado, para no reprocesar pulsaciones viejas entre corridas del comando. */
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
                if (! $callback) {
                    continue;
                }

                $this->handleCallback($callback, $telegram);
            }
        } while (! $this->option('once'));

        return self::SUCCESS;
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

        $this->info("Equipo {$alert->equipment->code} detenido a pedido de Telegram (alerta #{$alert->id}).");
    }
}
