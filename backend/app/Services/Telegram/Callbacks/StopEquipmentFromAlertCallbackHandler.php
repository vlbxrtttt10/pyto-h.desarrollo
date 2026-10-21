<?php

namespace App\Services\Telegram\Callbacks;

use App\Models\MaintenanceAlert;
use App\Services\EquipmentEmergencyStopService;
use App\Services\TelegramNotifier;

class StopEquipmentFromAlertCallbackHandler implements TelegramCallbackHandler
{
    public function __construct(
        private TelegramNotifier $telegram,
        private EquipmentEmergencyStopService $emergencyStopService,
    ) {
    }

    public function matches(string $data): bool
    {
        return str_starts_with($data, 'stop_equipment:');
    }

    public function handle(string $data, array $callback, array $message): void
    {
        $alertId = (int) substr($data, strlen('stop_equipment:'));
        $alert = MaintenanceAlert::with('equipment')->find($alertId);

        if (! $alert) {
            $this->telegram->answerCallbackQuery($callback['id'], 'Esta alerta ya no existe.');

            return;
        }

        if ($alert->status !== 'open') {
            $this->telegram->answerCallbackQuery($callback['id'], "Esta alerta ya fue atendida ({$alert->status}).");

            return;
        }

        $this->emergencyStopService->acknowledgeAlertAndStop($alert);

        $this->telegram->answerCallbackQuery($callback['id'], "Equipo {$alert->equipment->code} marcado como detenido.");
        $this->telegram->markMessageAsHandled(
            $message['chat']['id'],
            $message['message_id'],
            $message['text'],
            '🛑 <b>Equipo detenido</b> — marcado como "En falla" en el sistema.'
        );
    }
}
