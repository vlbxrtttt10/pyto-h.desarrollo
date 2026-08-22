<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fuel_anomalies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('haul_trip_id')->constrained()->cascadeOnDelete();
            $table->enum('cause', [
                'excessive_idling',
                'harsh_driving',
                'wrong_gear_usage',
                'excessive_braking',
                'possible_mechanical_fault',
                'unknown',
            ]);
            $table->enum('severity', ['low', 'medium', 'high'])->default('medium');
            $table->decimal('extra_liters', 8, 2);
            $table->decimal('extra_cost', 10, 2)->default(0);
            $table->text('explanation')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fuel_anomalies');
    }
};
