<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'is_super_admin',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_super_admin' => 'boolean',
        ];
    }

    public function modulePermissions(): HasMany
    {
        return $this->hasMany(ModulePermission::class);
    }

    public function hasModulePermission(string $module, string $action): bool
    {
        if ($this->is_super_admin) {
            return true;
        }

        $permission = $this->relationLoaded('modulePermissions')
            ? $this->modulePermissions->firstWhere('module', $module)
            : $this->modulePermissions()->where('module', $module)->first();

        return (bool) ($permission?->{"can_{$action}"} ?? false);
    }
}
