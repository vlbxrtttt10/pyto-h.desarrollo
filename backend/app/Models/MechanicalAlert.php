<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MechanicalAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'truck_id',
        'title',
        'description',
        'risk_level',
        'consecutive_deviation_percent',
        'trips_considered',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'consecutive_deviation_percent' => 'decimal:2',
        ];
    }

    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }
}
