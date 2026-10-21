<?php

namespace App\Services\Telegram;

use App\Services\Telegram\Commands\TelegramCommandHandler;

class TelegramCommandRouter
{
    /** @var TelegramCommandHandler[] */
    private array $handlers;

    public function __construct(TelegramCommandHandler ...$handlers)
    {
        $this->handlers = $handlers;
    }

    public function route(int $chatId, string $text): void
    {
        if (! str_starts_with($text, '/')) {
            return;
        }

        foreach ($this->handlers as $handler) {
            if ($handler->matches($text)) {
                $handler->handle($chatId, $text);

                return;
            }
        }
    }
}
