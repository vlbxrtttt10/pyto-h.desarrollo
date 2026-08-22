<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'is_super_admin',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
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

    /**
     * "Admin total" implica acceso completo a todos los modulos,
     * independientemente de lo guardado en module_permissions.
     */
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
