<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MechanicalAlert;
use Illuminate\Http\Request;

class MechanicalAlertController extends Controller
{
    public function index(Request $request)
    {
        $query = MechanicalAlert::with('truck');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $alerts = $query->orderByDesc('created_at')->get();

        return response()->json($alerts);
    }

    public function update(Request $request, MechanicalAlert $mechanicalAlert)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:open,acknowledged,resolved'],
        ]);

        $mechanicalAlert->update($validated);

        return response()->json($mechanicalAlert->fresh('truck'));
    }
}
