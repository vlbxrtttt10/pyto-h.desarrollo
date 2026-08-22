<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Operator extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_code',
        'name',
        'shift',
        'hired_at',
        'photo_url',
    ];

    protected function casts(): array
    {
        return [
            'hired_at' => 'date',
        ];
    }

    public function haulTrips(): HasMany
    {
        return $this->hasMany(HaulTrip::class);
    }
}
