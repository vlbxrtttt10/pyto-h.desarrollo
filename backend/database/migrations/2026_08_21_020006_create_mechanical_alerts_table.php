<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mechanical_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('truck_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->enum('risk_level', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->decimal('consecutive_deviation_percent', 6, 2)->comment('Desviacion promedio sostenida que disparo la alerta');
            $table->unsignedInteger('trips_considered')->default(0);
            $table->enum('status', ['open', 'acknowledged', 'resolved'])->default('open');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mechanical_alerts');
    }
};
