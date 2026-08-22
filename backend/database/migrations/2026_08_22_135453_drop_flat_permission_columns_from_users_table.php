<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Reemplaza los permisos planos (un solo can_view/can_create/... global)
     * por permisos granulares en la tabla module_permissions. is_super_admin
     * se mantiene: sigue implicando acceso total a todos los modulos.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['can_view', 'can_create', 'can_edit', 'can_delete']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('can_view')->default(true)->after('is_super_admin');
            $table->boolean('can_create')->default(false)->after('can_view');
            $table->boolean('can_edit')->default(false)->after('can_create');
            $table->boolean('can_delete')->default(false)->after('can_edit');
        });
    }
};
