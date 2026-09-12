<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipment_components', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipment_id')->constrained('equipments')->cascadeOnDelete();
            $table->foreignId('component_id')->constrained()->cascadeOnDelete();
            $table->date('installed_at')->nullable();
            $table->timestamps();

            $table->unique(['equipment_id', 'component_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipment_components');
    }
};
