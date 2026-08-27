<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\EquipmentAnomaly;
use App\Models\MaintenanceAlert;
use App\Models\ServiceVisit;
use App\Services\MaintenanceIntelligenceService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private MaintenanceIntelligenceService $maintenanceIntelligence)
    {
    }

    public function summary(Request $request)
    {
        $from = $request->query('from');
        $to = $request->query('to');

        $visitsQuery = ServiceVisit::query()->whereNotNull('deviation_percent');
        if ($from) {
            $visitsQuery->where('visited_at', '>=', $from);
        }
        if ($to) {
            $visitsQuery->where('visited_at', '<=', $to);
        }

        $totalVisits = (clone $visitsQuery)->count();
        $preventiveVisits = (clone $visitsQuery)->where('type', 'preventivo')->count();
        $correctiveVisits = (clone $visitsQuery)->where('type', 'correctivo')->count();
        $avgDeviation = (clone $visitsQuery)->avg('deviation_percent');

        $visitIds = (clone $visitsQuery)->pluck('id');

        $anomalies = EquipmentAnomaly::whereIn('service_visit_id', $visitIds)->get();
        $totalDowntimeHoursAvoided = $anomalies->sum('estimated_downtime_hours');

        $causeBreakdown = $anomalies->groupBy('cause')->map(function ($group) {
            return [
                'count' => $group->count(),
                'estimated_downtime_hours' => round($group->sum('estimated_downtime_hours'), 2),
            ];
        });

        return response()->json([
            'total_visits' => $totalVisits,
            'preventive_visits' => $preventiveVisits,
            'corrective_visits' => $correctiveVisits,
            'avg_deviation_percent' => round((float) $avgDeviation, 2),
            'total_anomalies' => $anomalies->count(),
            'total_downtime_hours_avoided' => round($totalDowntimeHoursAvoided, 2),
            'cause_breakdown' => $causeBreakdown,
            'open_maintenance_alerts' => MaintenanceAlert::where('status', 'open')->count(),
        ]);
    }

    public function technicianRanking(Request $request)
    {
        $ranking = $this->maintenanceIntelligence->technicianRanking(
            $request->query('from'),
            $request->query('to')
        );

        return response()->json($ranking->values());
    }

    public function fleetOverview()
    {
        $equipments = Equipment::withCount('serviceVisits')
            ->with(['maintenanceAlerts' => fn ($q) => $q->where('status', 'open')])
            ->get()
            ->map(function ($equipment) {
                $lastVisit = $equipment->serviceVisits()->latest('visited_at')->first();

                return [
                    'id' => $equipment->id,
                    'code' => $equipment->code,
                    'model' => $equipment->model,
                    'client' => $equipment->client,
                    'criticality' => $equipment->criticality,
                    'status' => $equipment->status,
                    'visits_count' => $equipment->service_visits_count,
                    'last_deviation_percent' => $lastVisit?->deviation_percent,
                    'open_alerts' => $equipment->maintenanceAlerts->count(),
                ];
            });

        return response()->json($equipments);
    }
}
