<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EquipmentAnomaly;
use Illuminate\Http\Request;

class EquipmentAnomalyController extends Controller
{
    public function index(Request $request)
    {
        $query = EquipmentAnomaly::with(['sensorReading.equipmentComponent.equipment', 'sensorReading.equipmentComponent.component']);

        if ($request->filled('cause')) {
            $query->where('cause', $request->query('cause'));
        }

        if ($request->filled('severity')) {
            $query->where('severity', $request->query('severity'));
        }

        $anomalies = $query->orderByDesc('created_at')->paginate(20);

        return response()->json($anomalies);
    }
}
