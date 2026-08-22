<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FuelAnomalyController;
use App\Http\Controllers\Api\HaulRouteController;
use App\Http\Controllers\Api\HaulTripController;
use App\Http\Controllers\Api\MechanicalAlertController;
use App\Http\Controllers\Api\OperatorController;
use App\Http\Controllers\Api\TruckController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', fn () => response()->json(['status' => 'ok']));

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/dashboard/operator-ranking', [DashboardController::class, 'operatorRanking']);
    Route::get('/dashboard/fleet-overview', [DashboardController::class, 'fleetOverview']);

    Route::apiResource('trucks', TruckController::class);
    Route::apiResource('operators', OperatorController::class);
    Route::apiResource('haul-routes', HaulRouteController::class);
    Route::apiResource('haul-trips', HaulTripController::class)->only(['index', 'store', 'show', 'destroy']);

    Route::get('/fuel-anomalies', [FuelAnomalyController::class, 'index']);

    Route::get('/mechanical-alerts', [MechanicalAlertController::class, 'index']);
    Route::patch('/mechanical-alerts/{mechanicalAlert}', [MechanicalAlertController::class, 'update']);

    Route::get('/users/modules', [UserController::class, 'modules']);
    Route::apiResource('users', UserController::class);
});
