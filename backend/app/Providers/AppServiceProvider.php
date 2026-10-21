<?php

namespace App\Providers;

use App\Services\Telegram\Callbacks\EmergencyStopCallbackHandler;
use App\Services\Telegram\Callbacks\MenuCallbackHandler;
use App\Services\Telegram\Callbacks\StopEquipmentFromAlertCallbackHandler;
use App\Services\Telegram\Commands\CmdsCommandHandler;
use App\Services\Telegram\Commands\PararCommandHandler;
use App\Services\Telegram\Commands\StatusCommandHandler;
use App\Services\Telegram\TelegramCallbackRouter;
use App\Services\Telegram\TelegramCommandRouter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(TelegramCommandRouter::class, function ($app) {
            return new TelegramCommandRouter(
                $app->make(CmdsCommandHandler::class),
                $app->make(StatusCommandHandler::class),
                $app->make(PararCommandHandler::class),
            );
        });

        $this->app->singleton(TelegramCallbackRouter::class, function ($app) {
            return new TelegramCallbackRouter(
                $app->make(MenuCallbackHandler::class),
                $app->make(EmergencyStopCallbackHandler::class),
                $app->make(StopEquipmentFromAlertCallbackHandler::class),
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
