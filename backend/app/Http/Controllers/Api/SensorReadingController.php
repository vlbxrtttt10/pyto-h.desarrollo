<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSensorReadingRequest;
use App\Models\SensorReading;
use App\Services\SensorMonitoringService;
use Illuminate\Http\Request;

class SensorReadingController extends Controller
{
    public function __construct(private SensorMonitoringService $sensorMonitoring)
    {
    }

    public function index(Request $request)
    {
        $query = SensorReading::with(['equipmentComponent.equipment', 'equipmentComponent.component', 'equipmentAnomalies']);

        if ($request->filled('equipment_id')) {
            $query->whereHas('equipmentComponent', fn ($q) => $q->where('equipment_id', $request->query('equipment_id')));
        }

        if ($request->filled('with_anomalies')) {
            $query->whereHas('equipmentAnomalies');
        }

        $readings = $query->orderByDesc('read_at')->paginate(20);

        return response()->json($readings);
    }

    public function store(StoreSensorReadingRequest $request)
    {
        $reading = SensorReading::create($request->validated());

        $reading = $this->sensorMonitoring->processReading($reading);

        return response()->json(
            $reading->load(['equipmentComponent.equipment', 'equipmentComponent.component', 'equipmentAnomalies']),
            201
        );
    }

    public function show(SensorReading $sensorReading)
    {
        return response()->json(
            $sensorReading->load(['equipmentComponent.equipment', 'equipmentComponent.component', 'equipmentAnomalies'])
        );
    }

    public function destroy(SensorReading $sensorReading)
    {
        $sensorReading->delete();

        return response()->json(null, 204);
    }
}
