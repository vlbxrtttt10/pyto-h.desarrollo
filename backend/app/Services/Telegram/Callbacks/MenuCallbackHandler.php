<?php

namespace App\Services\Telegram\Callbacks;

use App\Models\Equipment;
use App\Models\MaintenanceAlert;
use App\Services\Telegram\TelegramMessageFormatter;
use App\Services\TelegramNotifier;

class MenuCallbackHandler implements TelegramCallbackHandler
{
    public function __construct(
        private TelegramNotifier $telegram,
        private TelegramMessageFormatter $formatter,
    ) {
    }

    public function matches(string $data): bool
    {
        return str_starts_with($data, 'menu:');
    }

    public function handle(string $data, array $callback, array $message): void
    {
        $chatId = $message['chat']['id'];
        $option = substr($data, strlen('menu:'));

        match ($option) {
            'flota' => $this->sendFleetStatus($chatId),
            'en_falla', 'paro_emergencia', 'en_mantenimiento', 'operativo' => $this->sendEquipmentsByStatus($chatId, $option),
            'alertas' => $this->sendOpenAlerts($chatId),
            'ayuda' => $this->telegram->sendMessage($chatId, $this->formatter->help()),
            default => null,
        };

        $this->telegram->answerCallbackQuery($callback['id'], '');
    }

    private function sendFleetStatus(int $chatId): void
    {
        $equipments = Equipment::withCount(['maintenanceAlerts as open_alerts_count' => fn ($q) => $q->where('status', 'open')])
            ->orderBy('code')
            ->get();

        $this->telegram->sendMessage($chatId, $this->formatter->fleetStatus($equipments));
    }

    private function sendEquipmentsByStatus(int $chatId, string $status): void
    {
        $equipments = Equipment::where('status', $status)
            ->withCount(['maintenanceAlerts as open_alerts_count' => fn ($q) => $q->where('status', 'open')])
            ->orderBy('code')
            ->get();

        $this->telegram->sendMessage($chatId, $this->formatter->equipmentsByStatus($status, $equipments));
    }

    private function sendOpenAlerts(int $chatId): void
    {
        $alerts = MaintenanceAlert::with('equipment')
            ->where('status', 'open')
            ->orderByDesc('created_at')
            ->get();

        $this->telegram->sendMessage($chatId, $this->formatter->openAlertsList($alerts));
    }
}
