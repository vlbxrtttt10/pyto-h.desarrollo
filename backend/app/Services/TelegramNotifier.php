<?php

namespace App\Services;

use App\Models\MaintenanceAlert;
use App\Services\Telegram\TelegramKeyboards;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramNotifier
{
    private ?string $botToken;
    private ?string $chatId;

    public function __construct(private TelegramKeyboards $keyboards)
    {
        $this->botToken = config('services.telegram.bot_token');
        $this->chatId = config('services.telegram.chat_id');
    }

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
                'inline_keyboard' => $this->keyboards->stopEquipmentFromAlert($alert),
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

    public function getUpdates(?int $offset = null): array
    {
        if (! $this->botToken) {
            return [];
        }

        $response = Http::get("https://api.telegram.org/bot{$this->botToken}/getUpdates", array_filter([
            'offset' => $offset,
            'timeout' => 25,
            'allowed_updates' => json_encode(['callback_query', 'message']),
        ]));

        if ($response->failed()) {
            Log::warning('[TelegramNotifier] Fallo al consultar getUpdates', ['response' => $response->body()]);

            return [];
        }

        return $response->json('result', []);
    }

    public function sendMessage(int $chatId, string $text): void
    {
        if (! $this->botToken) {
            return;
        }

        Http::post("https://api.telegram.org/bot{$this->botToken}/sendMessage", [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'HTML',
        ]);
    }

    public function sendMessageWithButtons(int $chatId, string $text, array $inlineKeyboard): void
    {
        if (! $this->botToken) {
            return;
        }

        Http::post("https://api.telegram.org/bot{$this->botToken}/sendMessage", [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'HTML',
            'reply_markup' => json_encode(['inline_keyboard' => $inlineKeyboard]),
        ]);
    }

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
