<?php

namespace App\Services\Telegram\Commands;

interface TelegramCommandHandler
{
    public function matches(string $text): bool;

    public function handle(int $chatId, string $text): void;
}
