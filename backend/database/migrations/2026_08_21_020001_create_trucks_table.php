<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trucks', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('model');
            $table->decimal('tank_capacity_liters', 8, 2)->default(0);
            $table->decimal('empty_weight_tons', 8, 2)->default(0);
            $table->decimal('max_payload_tons', 8, 2)->default(0);
            $table->enum('status', ['active', 'maintenance', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trucks');
    }
};
