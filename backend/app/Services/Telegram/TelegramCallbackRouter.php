<?php

namespace App\Services\Telegram;

use App\Services\Telegram\Callbacks\TelegramCallbackHandler;

class TelegramCallbackRouter
{
    /** @var TelegramCallbackHandler[] */
    private array $handlers;

    public function __construct(TelegramCallbackHandler ...$handlers)
    {
        $this->handlers = $handlers;
    }

    public function route(array $callback): void
    {
        $data = $callback['data'] ?? '';
        $message = $callback['message'] ?? null;

        if (! $message || $data === '') {
            return;
        }

        foreach ($this->handlers as $handler) {
            if ($handler->matches($data)) {
                $handler->handle($data, $callback, $message);

                return;
            }
        }
    }
}
