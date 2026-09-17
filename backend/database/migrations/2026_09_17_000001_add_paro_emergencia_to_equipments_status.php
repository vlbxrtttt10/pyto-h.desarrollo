<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE equipments MODIFY COLUMN status ENUM('operativo', 'en_falla', 'en_mantenimiento', 'paro_emergencia') NOT NULL DEFAULT 'operativo'");
    }

    public function down(): void
    {
        DB::statement("UPDATE equipments SET status = 'en_falla' WHERE status = 'paro_emergencia'");
        DB::statement("ALTER TABLE equipments MODIFY COLUMN status ENUM('operativo', 'en_falla', 'en_mantenimiento') NOT NULL DEFAULT 'operativo'");
    }
};
