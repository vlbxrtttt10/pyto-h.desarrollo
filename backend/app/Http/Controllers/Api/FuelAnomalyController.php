<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FuelAnomaly;
use Illuminate\Http\Request;

class FuelAnomalyController extends Controller
{
    public function index(Request $request)
    {
        $query = FuelAnomaly::with(['haulTrip.truck', 'haulTrip.operator', 'haulTrip.haulRoute']);

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
