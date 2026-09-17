<?php

namespace App\Services\Telegram\Commands;

use App\Models\Equipment;
use App\Services\Telegram\TelegramKeyboards;
use App\Services\Telegram\TelegramMessageFormatter;
use App\Services\TelegramNotifier;

class PararCommandHandler implements TelegramCommandHandler
{
    public function __construct(
        private TelegramNotifier $telegram,
        private TelegramMessageFormatter $formatter,
        private TelegramKeyboards $keyboards,
    ) {
    }

    public function matches(string $text): bool
    {
        return str_starts_with($text, '/parar');
    }

    public function handle(int $chatId, string $text): void
    {
        $code = trim(substr($text, strlen('/parar')));

        if ($code === '') {
            $this->telegram->sendMessage($chatId, 'Escribe el codigo del equipo. Ejemplo: <code>/parar ULM-001</code>');

            return;
        }

        $equipment = Equipment::where('code', $code)->first();

        if (! $equipment) {
            $this->telegram->sendMessage($chatId, "No se encontro ningun equipo con el codigo <b>{$code}</b>.");

            return;
        }

        if ($equipment->status === 'en_falla') {
            $this->telegram->sendMessage($chatId, "⚠️ El equipo <b>{$equipment->code}</b> ya esta detenido (En falla).");

            return;
        }

        $this->telegram->sendMessageWithButtons(
            $chatId,
            $this->formatter->emergencyStopConfirmation($equipment),
            $this->keyboards->confirmEmergencyStop($equipment)
        );
    }
}
