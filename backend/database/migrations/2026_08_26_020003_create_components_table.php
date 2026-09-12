<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('components', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('equipment_type', ['ULM', 'ULP', 'UMO', 'ULE']);

            // Rangos normales de operacion, definidos por el PLC/sensor instalado.
            // Una lectura fuera de estos rangos dispara una anomalia.
            $table->decimal('min_temperature_celsius', 8, 2)->comment('Temperatura minima normal de operacion');
            $table->decimal('max_temperature_celsius', 8, 2)->comment('Temperatura maxima normal antes de sobrecalentamiento');
            $table->decimal('min_pressure_psi', 8, 2)->comment('Presion minima normal de operacion');
            $table->decimal('max_pressure_psi', 8, 2)->comment('Presion maxima normal antes de riesgo de fuga/derrame');
            $table->decimal('min_grease_level_percent', 5, 2)->default(20)->comment('Nivel minimo de grasa antes de alertar por bajo nivel');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('components');
    }
};
