<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HaulRoute;
use Illuminate\Http\Request;

class HaulRouteController extends Controller
{
    public function index()
    {
        return response()->json(HaulRoute::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string'],
            'origin' => ['required', 'string'],
            'destination' => ['required', 'string'],
            'distance_km' => ['required', 'numeric', 'min:0'],
            'average_grade_percent' => ['required', 'numeric'],
            'base_liters_per_ton_km' => ['required', 'numeric', 'min:0'],
        ]);

        $route = HaulRoute::create($validated);

        return response()->json($route, 201);
    }

    public function show(HaulRoute $haulRoute)
    {
        return response()->json($haulRoute);
    }

    public function update(Request $request, HaulRoute $haulRoute)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string'],
            'origin' => ['sometimes', 'string'],
            'destination' => ['sometimes', 'string'],
            'distance_km' => ['sometimes', 'numeric', 'min:0'],
            'average_grade_percent' => ['sometimes', 'numeric'],
            'base_liters_per_ton_km' => ['sometimes', 'numeric', 'min:0'],
        ]);

        $haulRoute->update($validated);

        return response()->json($haulRoute);
    }

    public function destroy(HaulRoute $haulRoute)
    {
        $haulRoute->delete();

        return response()->json(null, 204);
    }
}
