<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Se dispara cada vez que ocurre algo que cambia el estado general de la
 * flota (nueva lectura, anomalia, alerta, cambio de estado de un equipo),
 * para que el Dashboard en el frontend se refresque en tiempo real sin
 * necesidad de recargar la pagina.
 *
 * Implementa ShouldBroadcastNow (en vez de ShouldBroadcast) para emitirse de
 * forma sincronica sin depender de un worker de colas corriendo aparte.
 */
class DashboardUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public string $reason)
    {
    }

    public function broadcastOn(): array
    {
        return [new Channel('dashboard')];
    }

    public function broadcastAs(): string
    {
        return 'dashboard.updated';
    }

    public function broadcastWith(): array
    {
        return ['reason' => $this->reason];
    }
}
