<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FuelAnomaly extends Model
{
    use HasFactory;

    protected $fillable = [
        'haul_trip_id',
        'cause',
        'severity',
        'extra_liters',
        'extra_cost',
        'explanation',
    ];

    protected function casts(): array
    {
        return [
            'extra_liters' => 'decimal:2',
            'extra_cost' => 'decimal:2',
        ];
    }

    public function haulTrip(): BelongsTo
    {
        return $this->belongsTo(HaulTrip::class);
    }
}
