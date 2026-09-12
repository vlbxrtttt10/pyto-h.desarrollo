<?php

namespace Database\Seeders;

use App\Models\ModulePermission;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin Aleri',
            'email' => 'admin@aleri.mining',
            'is_super_admin' => true,
        ]);

        foreach (array_keys(ModulePermission::MODULES) as $module) {
            ModulePermission::create([
                'user_id' => $admin->id,
                'module' => $module,
                'can_view' => true, 'can_create' => true, 'can_edit' => true, 'can_delete' => true,
            ]);
        }
    }
}
