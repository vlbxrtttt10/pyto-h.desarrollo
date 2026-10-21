<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('components', function (Blueprint $table) {
            $table->unsignedInteger('expected_lifetime_hours')
                ->default(2000)
                ->after('min_grease_level_percent')
                ->comment('Horas de operacion estimadas antes de requerir reemplazo');
        });
    }

    public function down(): void
    {
        Schema::table('components', function (Blueprint $table) {
            $table->dropColumn('expected_lifetime_hours');
        });
    }
};
