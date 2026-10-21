<?php

namespace App\Services\Telegram\Commands;

use App\Models\Equipment;
use App\Services\Telegram\TelegramMessageFormatter;
use App\Services\TelegramNotifier;

class StatusCommandHandler implements TelegramCommandHandler
{
    public function __construct(
        private TelegramNotifier $telegram,
        private TelegramMessageFormatter $formatter,
    ) {
    }

    public function matches(string $text): bool
    {
        return str_starts_with($text, '/status');
    }

    public function handle(int $chatId, string $text): void
    {
        $code = trim(substr($text, strlen('/status')));

        if ($code === '') {
            $this->sendFleetStatus($chatId);

            return;
        }

        $this->sendEquipmentStatus($chatId, $code);
    }

    private function sendFleetStatus(int $chatId): void
    {
        $equipments = Equipment::withCount(['maintenanceAlerts as open_alerts_count' => fn ($q) => $q->where('status', 'open')])
            ->orderBy('code')
            ->get();

        $this->telegram->sendMessage($chatId, $this->formatter->fleetStatus($equipments));
    }

    private function sendEquipmentStatus(int $chatId, string $code): void
    {
        $equipment = Equipment::where('code', $code)->first();

        if (! $equipment) {
            $this->telegram->sendMessage($chatId, "No se encontro ningun equipo con el codigo <b>{$code}</b>.");

            return;
        }

        $this->telegram->sendMessage($chatId, $this->formatter->equipmentDetail($equipment));
    }
}
