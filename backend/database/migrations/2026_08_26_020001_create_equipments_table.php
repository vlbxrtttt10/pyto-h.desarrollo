<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipments', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->enum('type', ['ULM', 'ULP', 'UMO', 'ULE']);
            $table->string('model');
            $table->string('client');
            $table->string('site')->nullable();
            $table->enum('criticality', ['alta', 'media', 'baja'])->default('media');
            $table->date('install_date')->nullable();
            $table->enum('status', ['operativo', 'en_falla', 'en_mantenimiento'])->default('operativo');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipments');
    }
};
