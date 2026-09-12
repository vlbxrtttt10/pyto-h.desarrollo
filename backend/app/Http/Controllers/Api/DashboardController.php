<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\EquipmentAnomaly;
use App\Models\MaintenanceAlert;
use App\Models\SensorReading;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request)
    {
        $from = $request->query('from');
        $to = $request->query('to');

        $readingsQuery = SensorReading::query();
        if ($from) {
            $readingsQuery->where('read_at', '>=', $from);
        }
        if ($to) {
            $readingsQuery->where('read_at', '<=', $to);
        }

        $totalReadings = (clone $readingsQuery)->count();
        $readingIds = (clone $readingsQuery)->pluck('id');

        $anomalies = EquipmentAnomaly::whereIn('sensor_reading_id', $readingIds)->get();
        $totalDowntimeHoursAvoided = $anomalies->sum('estimated_downtime_hours');

        $causeBreakdown = $anomalies->groupBy('cause')->map(function ($group) {
            return [
                'count' => $group->count(),
                'estimated_downtime_hours' => round($group->sum('estimated_downtime_hours'), 2),
            ];
        });

        return response()->json([
            'total_readings' => $totalReadings,
            'total_anomalies' => $anomalies->count(),
            'total_downtime_hours_avoided' => round($totalDowntimeHoursAvoided, 2),
            'cause_breakdown' => $causeBreakdown,
            'open_maintenance_alerts' => MaintenanceAlert::where('status', 'open')->count(),
        ]);
    }

    public function fleetOverview()
    {
        $equipments = Equipment::withCount('sensorReadings')
            ->with(['maintenanceAlerts' => fn ($q) => $q->where('status', 'open')])
            ->get()
            ->map(function ($equipment) {
                $lastReading = $equipment->sensorReadings()->latest('read_at')->first();

                return [
                    'id' => $equipment->id,
                    'code' => $equipment->code,
                    'model' => $equipment->model,
                    'client' => $equipment->client,
                    'criticality' => $equipment->criticality,
                    'status' => $equipment->status,
                    'readings_count' => $equipment->sensor_readings_count,
                    'last_reading_at' => $lastReading?->read_at,
                    'open_alerts' => $equipment->maintenanceAlerts->count(),
                ];
            });

        return response()->json($equipments);
    }
}
