<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipment_id')->constrained('equipments')->cascadeOnDelete();
            $table->foreignId('technician_id')->constrained()->cascadeOnDelete();
            $table->foreignId('component_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['preventivo', 'correctivo', 'instalacion']);
            $table->dateTime('visited_at');

            // Lecturas tomadas por el tecnico en campo
            $table->decimal('pump_pressure_psi', 8, 2);
            $table->decimal('dispensed_volume_liters', 8, 2);
            $table->decimal('cycle_time_minutes', 8, 2);
            $table->decimal('operating_hours', 8, 2)->default(0);

            $table->decimal('deviation_percent', 6, 2)->nullable()->comment('Desviacion combinada respecto al comportamiento esperado del componente');
            $table->text('notes')->nullable();
            $table->string('parts_used')->nullable();

            $table->timestamps();

            $table->index(['equipment_id', 'visited_at']);
            $table->index(['technician_id', 'visited_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_visits');
    }
};
