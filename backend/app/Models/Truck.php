<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Truck extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'model',
        'tank_capacity_liters',
        'empty_weight_tons',
        'max_payload_tons',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'tank_capacity_liters' => 'decimal:2',
            'empty_weight_tons' => 'decimal:2',
            'max_payload_tons' => 'decimal:2',
        ];
    }

    public function haulTrips(): HasMany
    {
        return $this->hasMany(HaulTrip::class);
    }

    public function mechanicalAlerts(): HasMany
    {
        return $this->hasMany(MechanicalAlert::class);
    }
}
