<?php

namespace App\Services\Telegram;

use App\Models\Equipment;
use App\Models\MaintenanceAlert;

class TelegramKeyboards
{
    public function mainMenu(): array
    {
        return [
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
    }

    public function confirmEmergencyStop(Equipment $equipment): array
    {
        return [[
            ['text' => '🛑 Si, detener ahora', 'callback_data' => "confirm_stop:{$equipment->id}"],
            ['text' => '✖️ Cancelar', 'callback_data' => "cancel_stop:{$equipment->id}"],
        ]];
    }

    public function stopEquipmentFromAlert(MaintenanceAlert $alert): array
    {
        return [[
            ['text' => '🛑 Detener equipo', 'callback_data' => "stop_equipment:{$alert->id}"],
        ]];
    }
}
