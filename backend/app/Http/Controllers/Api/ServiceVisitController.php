<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServiceVisitRequest;
use App\Models\ServiceVisit;
use App\Services\MaintenanceIntelligenceService;
use Illuminate\Http\Request;

class ServiceVisitController extends Controller
{
    public function __construct(private MaintenanceIntelligenceService $maintenanceIntelligence)
    {
    }

    public function index(Request $request)
    {
        $query = ServiceVisit::with(['equipment', 'technician', 'component', 'equipmentAnomalies']);

        if ($request->filled('equipment_id')) {
            $query->where('equipment_id', $request->query('equipment_id'));
        }

        if ($request->filled('technician_id')) {
            $query->where('technician_id', $request->query('technician_id'));
        }

        if ($request->filled('with_anomalies')) {
            $query->whereHas('equipmentAnomalies');
        }

        $visits = $query->orderByDesc('visited_at')->paginate(20);

        return response()->json($visits);
    }

    public function store(StoreServiceVisitRequest $request)
    {
        $visit = ServiceVisit::create($request->validated());

        $visit = $this->maintenanceIntelligence->processVisit($visit);

        return response()->json(
            $visit->load(['equipment', 'technician', 'component', 'equipmentAnomalies']),
            201
        );
    }

    public function show(ServiceVisit $serviceVisit)
    {
        return response()->json(
            $serviceVisit->load(['equipment', 'technician', 'component', 'equipmentAnomalies'])
        );
    }

    public function destroy(ServiceVisit $serviceVisit)
    {
        $serviceVisit->delete();

        return response()->json(null, 204);
    }
}
