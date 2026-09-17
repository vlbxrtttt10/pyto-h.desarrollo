<?php

namespace App\Services\Telegram\Callbacks;

interface TelegramCallbackHandler
{
    public function matches(string $data): bool;

    public function handle(string $data, array $callback, array $message): void;
}
