<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EquipmentAnomaly extends Model
{
    use HasFactory;

    protected $fillable = [
        'sensor_reading_id',
        'cause',
        'severity',
        'estimated_downtime_hours',
        'explanation',
    ];

    protected function casts(): array
    {
        return [
            'estimated_downtime_hours' => 'decimal:2',
        ];
    }

    public function sensorReading(): BelongsTo
    {
        return $this->belongsTo(SensorReading::class);
    }
}
