<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipment_anomalies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sensor_reading_id')->constrained()->cascadeOnDelete();
            $table->enum('cause', [
                'overheating',
                'overpressure',
                'low_grease_level',
                'unknown',
            ]);
            $table->enum('severity', ['low', 'medium', 'high'])->default('medium');
            $table->decimal('estimated_downtime_hours', 8, 2)->default(0);
            $table->text('explanation')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipment_anomalies');
    }
};
