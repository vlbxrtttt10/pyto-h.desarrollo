<?php

namespace App\Services\Telegram\Callbacks;

use App\Models\Equipment;
use App\Services\EquipmentEmergencyStopService;
use App\Services\TelegramNotifier;

class EmergencyStopCallbackHandler implements TelegramCallbackHandler
{
    public function __construct(
        private TelegramNotifier $telegram,
        private EquipmentEmergencyStopService $emergencyStopService,
    ) {
    }

    public function matches(string $data): bool
    {
        return str_starts_with($data, 'confirm_stop:') || str_starts_with($data, 'cancel_stop:');
    }

    public function handle(string $data, array $callback, array $message): void
    {
        if (str_starts_with($data, 'cancel_stop:')) {
            $this->telegram->answerCallbackQuery($callback['id'], 'Parada de emergencia cancelada.');
            $this->telegram->markMessageAsHandled(
                $message['chat']['id'],
                $message['message_id'],
                $message['text'],
                '✖️ <b>Cancelado</b> — el equipo no fue detenido.'
            );

            return;
        }

        $equipmentId = (int) substr($data, strlen('confirm_stop:'));
        $equipment = Equipment::find($equipmentId);

        if (! $equipment) {
            $this->telegram->answerCallbackQuery($callback['id'], 'Este equipo ya no existe.');

            return;
        }

        if (in_array($equipment->status, ['en_falla', 'paro_emergencia'], true)) {
            $this->telegram->answerCallbackQuery($callback['id'], 'Este equipo ya estaba detenido.');

            return;
        }

        $alert = $this->emergencyStopService->createEmergencyStop($equipment);

        $this->telegram->answerCallbackQuery($callback['id'], "🛑 Equipo {$equipment->code} detenido de emergencia.");
        $this->telegram->markMessageAsHandled(
            $message['chat']['id'],
            $message['message_id'],
            $message['text'],
            '🛑 <b>Equipo detenido</b> — se origino un paro de emergencia.'
        );
    }
}
