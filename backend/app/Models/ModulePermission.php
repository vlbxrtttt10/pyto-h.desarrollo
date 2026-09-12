<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModulePermission extends Model
{
    /**
     * Modulos gestionables del sistema. El Dashboard no aparece aqui: es
     * visible para cualquier usuario autenticado, sin permisos granulares.
     */
    public const MODULES = [
        'equipos' => 'Equipos',
        'componentes' => 'Componentes',
        'lecturas' => 'Lecturas de sensores',
        'anomalias' => 'Anomalias de equipo',
        'alertas_mantenimiento' => 'Alertas de mantenimiento',
        'usuarios' => 'Usuarios',
    ];

    protected $fillable = [
        'user_id',
        'module',
        'can_view',
        'can_create',
        'can_edit',
        'can_delete',
    ];

    protected function casts(): array
    {
        return [
            'can_view' => 'boolean',
            'can_create' => 'boolean',
            'can_edit' => 'boolean',
            'can_delete' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
