<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HaulRoute extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'origin',
        'destination',
        'distance_km',
        'average_grade_percent',
        'base_liters_per_ton_km',
    ];

    protected function casts(): array
    {
        return [
            'distance_km' => 'decimal:2',
            'average_grade_percent' => 'decimal:2',
            'base_liters_per_ton_km' => 'decimal:4',
        ];
    }

    public function haulTrips(): HasMany
    {
        return $this->hasMany(HaulTrip::class);
    }
}
