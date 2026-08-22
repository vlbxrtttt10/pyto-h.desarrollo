<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HaulTrip extends Model
{
    use HasFactory;

    protected $fillable = [
        'truck_id',
        'operator_id',
        'haul_route_id',
        'started_at',
        'ended_at',
        'payload_tons',
        'idle_minutes',
        'driving_minutes',
        'harsh_braking_events',
        'harsh_acceleration_events',
        'wrong_gear_events',
        'avg_speed_kmh',
        'fuel_consumed_liters',
        'expected_fuel_liters',
        'deviation_percent',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'payload_tons' => 'decimal:2',
            'avg_speed_kmh' => 'decimal:2',
            'fuel_consumed_liters' => 'decimal:2',
            'expected_fuel_liters' => 'decimal:2',
            'deviation_percent' => 'decimal:2',
        ];
    }

    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }

    public function operator(): BelongsTo
    {
        return $this->belongsTo(Operator::class);
    }

    public function haulRoute(): BelongsTo
    {
        return $this->belongsTo(HaulRoute::class);
    }

    public function fuelAnomalies(): HasMany
    {
        return $this->hasMany(FuelAnomaly::class);
    }
}
