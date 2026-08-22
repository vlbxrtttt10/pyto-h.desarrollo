<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreHaulTripRequest;
use App\Models\HaulTrip;
use App\Services\FuelIntelligenceService;
use Illuminate\Http\Request;

class HaulTripController extends Controller
{
    public function __construct(private FuelIntelligenceService $fuelIntelligence)
    {
    }

    public function index(Request $request)
    {
        $query = HaulTrip::with(['truck', 'operator', 'haulRoute', 'fuelAnomalies']);

        if ($request->filled('truck_id')) {
            $query->where('truck_id', $request->query('truck_id'));
        }

        if ($request->filled('operator_id')) {
            $query->where('operator_id', $request->query('operator_id'));
        }

        if ($request->filled('with_anomalies')) {
            $query->whereHas('fuelAnomalies');
        }

        $trips = $query->orderByDesc('started_at')->paginate(20);

        return response()->json($trips);
    }

    public function store(StoreHaulTripRequest $request)
    {
        $trip = HaulTrip::create($request->validated());

        $trip = $this->fuelIntelligence->processTrip($trip);

        return response()->json(
            $trip->load(['truck', 'operator', 'haulRoute', 'fuelAnomalies']),
            201
        );
    }

    public function show(HaulTrip $haulTrip)
    {
        return response()->json(
            $haulTrip->load(['truck', 'operator', 'haulRoute', 'fuelAnomalies'])
        );
    }

    public function destroy(HaulTrip $haulTrip)
    {
        $haulTrip->delete();

        return response()->json(null, 204);
    }
}
