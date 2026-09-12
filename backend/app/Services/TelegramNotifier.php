<?php

namespace App\Services;

use App\Models\MaintenanceAlert;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramNotifier
{
    private ?string $botToken;
    private ?string $chatId;

    public function __construct()
    {
        $this->botToken = config('services.telegram.bot_token');
        $this->chatId = config('services.telegram.chat_id');
    }

    /**
     * Envia una alerta de mantenimiento por Telegram. Si el bot todavia no
     * esta configurado (sin token/chat_id), no falla: registra el mensaje en
     * el log para poder verificar el contenido mientras se configura el bot.
     */
    public function sendMaintenanceAlert(MaintenanceAlert $alert): bool
    {
        $alert->loadMissing('equipment');
        $message = $this->buildMessage($alert);

        if (! $this->botToken || ! $this->chatId) {
            Log::info('[TelegramNotifier] Bot no configurado, mensaje no enviado (modo log): '.$message);

            return false;
        }

        $response = Http::post("https://api.telegram.org/bot{$this->botToken}/sendMessage", [
            'chat_id' => $this->chatId,
            'text' => $message,
            'parse_mode' => 'HTML',
            'reply_markup' => json_encode([
                'inline_keyboard' => [[
                    ['text' => '🛑 Detener equipo', 'callback_data' => "stop_equipment:{$alert->id}"],
                ]],
            ]),
        ]);

        if ($response->failed()) {
            Log::warning('[TelegramNotifier] Fallo el envio de la alerta', [
                'alert_id' => $alert->id,
                'response' => $response->body(),
            ]);

            return false;
        }

        $alert->update(['telegram_notified' => true]);

        return true;
    }

    /**
     * Obtiene los updates pendientes del bot (mensajes y pulsaciones de
     * botones) via long-polling. $offset evita recibir de nuevo updates ya
     * procesados en una consulta anterior.
     */
    public function getUpdates(?int $offset = null): array
    {
        if (! $this->botToken) {
            return [];
        }

        $response = Http::get("https://api.telegram.org/bot{$this->botToken}/getUpdates", array_filter([
            'offset' => $offset,
            'timeout' => 25,
            'allowed_updates' => json_encode(['callback_query']),
        ]));

        if ($response->failed()) {
            Log::warning('[TelegramNotifier] Fallo al consultar getUpdates', ['response' => $response->body()]);

            return [];
        }

        return $response->json('result', []);
    }

    /**
     * Responde visualmente a la pulsacion de un boton (el "reloj" de carga
     * que ve el usuario en Telegram mientras se procesa la accion).
     */
    public function answerCallbackQuery(string $callbackQueryId, string $text): void
    {
        if (! $this->botToken) {
            return;
        }

        Http::post("https://api.telegram.org/bot{$this->botToken}/answerCallbackQuery", [
            'callback_query_id' => $callbackQueryId,
            'text' => $text,
        ]);
    }

    /**
     * Edita el mensaje original tras procesar la accion, quitando el boton y
     * agregando una linea de confirmacion, para que quede claro en el chat
     * que la alerta ya fue atendida.
     */
    public function markMessageAsHandled(int $chatId, int $messageId, string $originalText, string $confirmationLine): void
    {
        if (! $this->botToken) {
            return;
        }

        Http::post("https://api.telegram.org/bot{$this->botToken}/editMessageText", [
            'chat_id' => $chatId,
            'message_id' => $messageId,
            'text' => $originalText."\n\n".$confirmationLine,
            'parse_mode' => 'HTML',
        ]);
    }

    private function buildMessage(MaintenanceAlert $alert): string
    {
        $equipment = $alert->equipment;
        $riskEmoji = match ($alert->risk_level) {
            'critical' => '🔴',
            'high' => '🟠',
            'medium' => '🟡',
            default => '🟢',
        };

        return sprintf(
            "%s <b>Alerta de mantenimiento</b>\n\n".
            "<b>Equipo:</b> %s (%s)\n".
            "<b>Cliente/Proyecto:</b> %s\n".
            "<b>Sitio:</b> %s\n".
            "<b>Riesgo:</b> %s\n\n".
            "%s\n\n".
            "<b>Accion recomendada:</b> %s",
            $riskEmoji,
            $equipment->code,
            $equipment->model,
            $equipment->client,
            $equipment->site ?: 'No especificado',
            strtoupper($alert->risk_level),
            $alert->description,
            $alert->recommended_action ?: 'Sin recomendacion registrada.'
        );
    }
}
