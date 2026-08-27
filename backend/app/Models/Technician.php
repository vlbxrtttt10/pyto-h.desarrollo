<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Technician extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_code',
        'name',
        'specialty',
        'hired_at',
        'photo_url',
    ];

    protected function casts(): array
    {
        return [
            'hired_at' => 'date',
        ];
    }

    public function serviceVisits(): HasMany
    {
        return $this->hasMany(ServiceVisit::class);
    }
}
