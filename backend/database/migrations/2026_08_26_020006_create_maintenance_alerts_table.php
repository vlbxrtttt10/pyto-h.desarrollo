<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipment_id')->constrained('equipments')->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->text('recommended_action')->nullable();
            $table->enum('risk_level', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->unsignedInteger('readings_considered')->default(0);
            $table->enum('status', ['open', 'acknowledged', 'resolved'])->default('open');
            $table->boolean('telegram_notified')->default(false)->comment('Si ya se envio la notificacion por Telegram para esta alerta');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_alerts');
    }
};
