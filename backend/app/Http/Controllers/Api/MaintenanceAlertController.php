<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceAlert;
use Illuminate\Http\Request;

class MaintenanceAlertController extends Controller
{
    public function index(Request $request)
    {
        $query = MaintenanceAlert::with('equipment');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $alerts = $query->orderByDesc('created_at')->get();

        return response()->json($alerts);
    }

    public function update(Request $request, MaintenanceAlert $maintenanceAlert)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:open,acknowledged,resolved'],
        ]);

        $maintenanceAlert->update($validated);

        return response()->json($maintenanceAlert->fresh('equipment'));
    }
}
