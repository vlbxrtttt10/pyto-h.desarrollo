<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Equipment extends Model
{
    use HasFactory;

    protected $table = 'equipments';

    protected $fillable = [
        'code',
        'type',
        'model',
        'client',
        'site',
        'criticality',
        'install_date',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'install_date' => 'date',
        ];
    }

    public function equipmentComponents(): HasMany
    {
        return $this->hasMany(EquipmentComponent::class);
    }

    public function sensorReadings(): HasManyThrough
    {
        return $this->hasManyThrough(SensorReading::class, EquipmentComponent::class);
    }

    public function maintenanceAlerts(): HasMany
    {
        return $this->hasMany(MaintenanceAlert::class);
    }
}
