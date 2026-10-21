<?php

namespace App\Console\Commands;

use App\Services\Telegram\TelegramCallbackRouter;
use App\Services\Telegram\TelegramCommandRouter;
use App\Services\TelegramNotifier;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class PollTelegramUpdates extends Command
{
    protected $signature = 'telegram:poll {--once : Consultar una sola vez y salir, en vez de correr en loop}';

    protected $description = 'Escucha los mensajes y botones del bot de Telegram (comandos, paro de emergencia, detener equipo) y actualiza el sistema.';

    private const OFFSET_CACHE_KEY = 'telegram_poll_offset';

    public function handle(
        TelegramNotifier $telegram,
        TelegramCommandRouter $commandRouter,
        TelegramCallbackRouter $callbackRouter,
    ): int {
        $this->info('Escuchando respuestas del bot de Telegram (Ctrl+C para detener)...');

        $offset = Cache::get(self::OFFSET_CACHE_KEY);

        do {
            $updates = $telegram->getUpdates($offset);

            foreach ($updates as $update) {
                $offset = $update['update_id'] + 1;
                Cache::forever(self::OFFSET_CACHE_KEY, $offset);

                $callback = $update['callback_query'] ?? null;
                if ($callback) {
                    $callbackRouter->route($callback);

                    continue;
                }

                $message = $update['message'] ?? null;
                if ($message) {
                    $text = trim($message['text'] ?? '');
                    $chatId = $message['chat']['id'] ?? null;

                    if ($chatId) {
                        $commandRouter->route($chatId, $text);
                    }
                }
            }
        } while (! $this->option('once'));

        return self::SUCCESS;
    }
}
