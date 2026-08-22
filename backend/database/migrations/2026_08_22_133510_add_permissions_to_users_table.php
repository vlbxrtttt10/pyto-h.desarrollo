<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_super_admin')->default(false)->after('password');
            $table->boolean('can_view')->default(true)->after('is_super_admin');
            $table->boolean('can_create')->default(false)->after('can_view');
            $table->boolean('can_edit')->default(false)->after('can_create');
            $table->boolean('can_delete')->default(false)->after('can_edit');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['is_super_admin', 'can_view', 'can_create', 'can_edit', 'can_delete']);
        });
    }
};
