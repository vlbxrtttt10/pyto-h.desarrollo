<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('haul_trips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('truck_id')->constrained()->cascadeOnDelete();
            $table->foreignId('operator_id')->constrained()->cascadeOnDelete();
            $table->foreignId('haul_route_id')->constrained()->cascadeOnDelete();
            $table->dateTime('started_at');
            $table->dateTime('ended_at');
            $table->decimal('payload_tons', 8, 2);

            // Telemetria cruda
            $table->unsignedInteger('idle_minutes')->default(0);
            $table->unsignedInteger('driving_minutes')->default(0);
            $table->unsignedInteger('harsh_braking_events')->default(0);
            $table->unsignedInteger('harsh_acceleration_events')->default(0);
            $table->unsignedInteger('wrong_gear_events')->default(0);
            $table->decimal('avg_speed_kmh', 6, 2)->default(0);

            // Combustible
            $table->decimal('fuel_consumed_liters', 8, 2);
            $table->decimal('expected_fuel_liters', 8, 2)->nullable()->comment('Calculado por el motor de IA/reglas');
            $table->decimal('deviation_percent', 6, 2)->nullable()->comment('(real-esperado)/esperado * 100');

            $table->timestamps();

            $table->index(['truck_id', 'started_at']);
            $table->index(['operator_id', 'started_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('haul_trips');
    }
};
