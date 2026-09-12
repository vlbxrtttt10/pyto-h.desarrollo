<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SensorReading extends Model
{
    use HasFactory;

    protected $fillable = [
        'equipment_id',
        'component_id',
        'temperature_celsius',
        'pressure_psi',
        'grease_level_percent',
        'read_at',
        'source',
    ];

    protected function casts(): array
    {
        return [
            'temperature_celsius' => 'decimal:2',
            'pressure_psi' => 'decimal:2',
            'grease_level_percent' => 'decimal:2',
            'read_at' => 'datetime',
        ];
    }

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class);
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
