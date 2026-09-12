<?php

namespace App\Events;

use App\Models\MaintenanceAlert;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EquipmentStoppedViaTelegram implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public MaintenanceAlert $alert)
    {
    }

    public function broadcastOn(): array
    {
        return [new Channel('dashboard')];
    }

    public function broadcastAs(): string
    {
        return 'equipment.stopped';
    }

    public function broadcastWith(): array
    {
        return [
            'alert_id' => $this->alert->id,
            'equipment_id' => $this->alert->equipment->id,
            'equipment_code' => $this->alert->equipment->code,
            'equipment_client' => $this->alert->equipment->client,
            'risk_level' => $this->alert->risk_level,
            'title' => $this->alert->title,
            'stopped_at' => now()->toIso8601String(),
        ];
    }
}
