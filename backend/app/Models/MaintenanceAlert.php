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
        'readings_considered',
        'status',
        'telegram_notified',
    ];

    protected function casts(): array
    {
        return [
            'telegram_notified' => 'boolean',
        ];
    }

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class);
    }
}
