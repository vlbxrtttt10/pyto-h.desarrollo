<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Component extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'equipment_type',
        'min_temperature_celsius',
        'max_temperature_celsius',
        'min_pressure_psi',
        'max_pressure_psi',
        'min_grease_level_percent',
    ];

    protected function casts(): array
    {
        return [
            'min_temperature_celsius' => 'decimal:2',
            'max_temperature_celsius' => 'decimal:2',
            'min_pressure_psi' => 'decimal:2',
            'max_pressure_psi' => 'decimal:2',
            'min_grease_level_percent' => 'decimal:2',
        ];
    }

    public function equipmentComponents(): HasMany
    {
        return $this->hasMany(EquipmentComponent::class);
    }
}
