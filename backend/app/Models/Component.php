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
        'expected_pressure_psi',
        'expected_volume_liters',
        'expected_cycle_minutes',
    ];

    protected function casts(): array
    {
        return [
            'expected_pressure_psi' => 'decimal:2',
            'expected_volume_liters' => 'decimal:2',
            'expected_cycle_minutes' => 'decimal:2',
        ];
    }

    public function serviceVisits(): HasMany
    {
        return $this->hasMany(ServiceVisit::class);
    }
}
