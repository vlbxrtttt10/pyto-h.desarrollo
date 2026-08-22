<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FuelAnomaly;
use App\Models\HaulTrip;
use App\Models\MechanicalAlert;
use App\Services\FuelIntelligenceService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private FuelIntelligenceService $fuelIntelligence)
    {
    }

    public function summary(Request $request)
    {
        $from = $request->query('from');
        $to = $request->query('to');

        $tripsQuery = HaulTrip::query()->whereNotNull('deviation_percent');
        if ($from) {
            $tripsQuery->where('started_at', '>=', $from);
        }
        if ($to) {
            $tripsQuery->where('started_at', '<=', $to);
        }

        $totalTrips = (clone $tripsQuery)->count();
        $totalFuelConsumed = (clone $tripsQuery)->sum('fuel_consumed_liters');
        $totalFuelExpected = (clone $tripsQuery)->sum('expected_fuel_liters');
        $avgDeviation = (clone $tripsQuery)->avg('deviation_percent');

        $anomalyIds = (clone $tripsQuery)->pluck('id');

        $anomalies = FuelAnomaly::whereIn('haul_trip_id', $anomalyIds)->get();
        $totalExtraLiters = $anomalies->sum('extra_liters');
        $totalExtraCost = $anomalies->sum('extra_cost');

        $causeBreakdown = $anomalies->groupBy('cause')->map(function ($group) {
            return [
                'count' => $group->count(),
                'extra_liters' => round($group->sum('extra_liters'), 2),
                'extra_cost' => round($group->sum('extra_cost'), 2),
            ];
        });

        return response()->json([
            'total_trips' => $totalTrips,
            'total_fuel_consumed_liters' => round((float) $totalFuelConsumed, 2),
            'total_fuel_expected_liters' => round((float) $totalFuelExpected, 2),
            'avg_deviation_percent' => round((float) $avgDeviation, 2),
            'total_anomalies' => $anomalies->count(),
            'total_extra_liters' => round($totalExtraLiters, 2),
            'total_extra_cost' => round($totalExtraCost, 2),
            'cause_breakdown' => $causeBreakdown,
            'open_mechanical_alerts' => MechanicalAlert::where('status', 'open')->count(),
        ]);
    }

    public function operatorRanking(Request $request)
    {
        $ranking = $this->fuelIntelligence->operatorRanking(
            $request->query('from'),
            $request->query('to')
        );

        return response()->json($ranking->values());
    }

    public function fleetOverview()
    {
        $trucks = \App\Models\Truck::withCount('haulTrips')
            ->with(['mechanicalAlerts' => fn ($q) => $q->where('status', 'open')])
            ->get()
            ->map(function ($truck) {
                $lastTrip = $truck->haulTrips()->latest('started_at')->first();

                return [
                    'id' => $truck->id,
                    'code' => $truck->code,
                    'model' => $truck->model,
                    'status' => $truck->status,
                    'trips_count' => $truck->haul_trips_count,
                    'last_deviation_percent' => $lastTrip?->deviation_percent,
                    'open_alerts' => $truck->mechanicalAlerts->count(),
                ];
            });

        return response()->json($trucks);
    }
}
