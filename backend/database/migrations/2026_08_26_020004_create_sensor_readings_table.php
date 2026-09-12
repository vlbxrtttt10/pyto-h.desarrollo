<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sensor_readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipment_id')->constrained('equipments')->cascadeOnDelete();
            $table->foreignId('component_id')->constrained()->cascadeOnDelete();

            // Lectura enviada por el controlador (Node.js) que lee el PLC/sensor del equipo.
            $table->decimal('temperature_celsius', 8, 2);
            $table->decimal('pressure_psi', 8, 2);
            $table->decimal('grease_level_percent', 5, 2);

            $table->dateTime('read_at')->comment('Momento en que el sensor tomo la lectura');
            $table->string('source')->default('simulado')->comment('Origen de la lectura: simulado, plc-nodejs, etc.');

            $table->timestamps();

            $table->index(['equipment_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sensor_readings');
    }
};
