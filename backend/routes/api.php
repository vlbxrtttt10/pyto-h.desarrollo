<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ComponentController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EquipmentAnomalyController;
use App\Http\Controllers\Api\EquipmentController;
use App\Http\Controllers\Api\MaintenanceAlertController;
use App\Http\Controllers\Api\SensorReadingController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', fn () => response()->json(['status' => 'ok']));

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/dashboard/fleet-overview', [DashboardController::class, 'fleetOverview']);

    Route::apiResource('equipments', EquipmentController::class);
    Route::apiResource('components', ComponentController::class);
    Route::apiResource('sensor-readings', SensorReadingController::class)->only(['index', 'store', 'show', 'destroy']);

    Route::get('/equipment-anomalies', [EquipmentAnomalyController::class, 'index']);

    Route::get('/maintenance-alerts', [MaintenanceAlertController::class, 'index']);
    Route::patch('/maintenance-alerts/{maintenanceAlert}', [MaintenanceAlertController::class, 'update']);

    Route::get('/users/modules', [UserController::class, 'modules']);
    Route::apiResource('users', UserController::class);
});