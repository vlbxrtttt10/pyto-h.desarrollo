<?php

namespace App\Services;

use App\Events\DashboardUpdated;
use App\Events\EquipmentStoppedViaTelegram;
use App\Models\Equipment;
use App\Models\MaintenanceAlert;

class EquipmentEmergencyStopService
{
    public function acknowledgeAlertAndStop(MaintenanceAlert $alert): void
    {
        $alert->update(['status' => 'acknowledged']);

        $this->stopAndDispatchEvents($alert);
    }

    public function createEmergencyStop(Equipment $equipment): MaintenanceAlert
    {
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

        $this->stopAndDispatchEvents($alert);

        return $alert;
    }

    private function stopAndDispatchEvents(MaintenanceAlert $alert): void
    {
        $alert->equipment->update(['status' => 'en_falla']);

        DashboardUpdated::dispatch('equipment_stopped_via_telegram');
        EquipmentStoppedViaTelegram::dispatch($alert);
    }
}
