<?php

namespace App\Services\Telegram\Commands;

use App\Models\Equipment;
use App\Models\MaintenanceAlert;
use App\Services\Telegram\TelegramKeyboards;
use App\Services\Telegram\TelegramMessageFormatter;
use App\Services\TelegramNotifier;

class CmdsCommandHandler implements TelegramCommandHandler
{
    public function __construct(
        private TelegramNotifier $telegram,
        private TelegramMessageFormatter $formatter,
        private TelegramKeyboards $keyboards,
    ) {
    }

    public function matches(string $text): bool
    {
        return str_starts_with($text, '/cmds')
            || str_starts_with($text, '/start')
            || str_starts_with($text, '/help');
    }

    public function handle(int $chatId, string $text): void
    {
        $totalEquipos = Equipment::count();
        $alertasAbiertas = MaintenanceAlert::where('status', 'open')->count();

        $this->telegram->sendMessageWithButtons(
            $chatId,
            $this->formatter->commandMenu($totalEquipos, $alertasAbiertas),
            $this->keyboards->mainMenu()
        );
    }
}
