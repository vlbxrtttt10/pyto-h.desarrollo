<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceVisit extends Model
{
    use HasFactory;

    protected $fillable = [
        'equipment_id',
        'technician_id',
        'component_id',
        'type',
        'visited_at',
        'pump_pressure_psi',
        'dispensed_volume_liters',
        'cycle_time_minutes',
        'operating_hours',
        'deviation_percent',
        'notes',
        'parts_used',
    ];

    protected function casts(): array
    {
        return [
            'visited_at' => 'datetime',
            'pump_pressure_psi' => 'decimal:2',
            'dispensed_volume_liters' => 'decimal:2',
            'cycle_time_minutes' => 'decimal:2',
            'operating_hours' => 'decimal:2',
            'deviation_percent' => 'decimal:2',
        ];
    }

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class);
    }

    public function technician(): BelongsTo
    {
        return $this->belongsTo(Technician::class);
    }

    public function component(): BelongsTo
    {
        return $this->belongsTo(Component::class);
    }

    public function equipmentAnomalies(): HasMany
    {
        return $this->hasMany(EquipmentAnomaly::class);
    }
}
