<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'equipment_id',
        'title',
        'description',
        'recommended_action',
        'risk_level',
        'consecutive_deviation_percent',
        'visits_considered',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'consecutive_deviation_percent' => 'decimal:2',
        ];
    }

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class);
    }
}
