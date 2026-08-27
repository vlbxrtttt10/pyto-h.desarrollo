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
            $table->decimal('expected_pressure_psi', 8, 2)->comment('Presion de referencia esperada para este componente en condiciones normales');
            $table->decimal('expected_volume_liters', 8, 2)->comment('Volumen de referencia dispensado por ciclo, usado por el motor de deteccion');
            $table->decimal('expected_cycle_minutes', 8, 2)->comment('Duracion de referencia de un ciclo de trabajo');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('components');
    }
};
