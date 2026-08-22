<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('haul_routes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('origin');
            $table->string('destination');
            $table->decimal('distance_km', 8, 2);
            $table->decimal('average_grade_percent', 5, 2)->comment('Pendiente promedio de la ruta, positiva = subida');
            $table->decimal('base_liters_per_ton_km', 8, 4)->comment('Consumo base estimado por tonelada-km, usado por el motor de IA');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('haul_routes');
    }
};
