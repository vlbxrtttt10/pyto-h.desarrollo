<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Component;
use Illuminate\Http\Request;

class ComponentController extends Controller
{
    public function index()
    {
        return response()->json(Component::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string'],
            'equipment_type' => ['required', 'in:ULM,ULP,UMO,ULE'],
            'expected_pressure_psi' => ['required', 'numeric', 'min:0'],
            'expected_volume_liters' => ['required', 'numeric', 'min:0'],
            'expected_cycle_minutes' => ['required', 'numeric', 'min:0'],
        ]);

        $component = Component::create($validated);

        return response()->json($component, 201);
    }

    public function show(Component $component)
    {
        return response()->json($component);
    }

    public function update(Request $request, Component $component)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string'],
            'equipment_type' => ['sometimes', 'in:ULM,ULP,UMO,ULE'],
            'expected_pressure_psi' => ['sometimes', 'numeric', 'min:0'],
            'expected_volume_liters' => ['sometimes', 'numeric', 'min:0'],
            'expected_cycle_minutes' => ['sometimes', 'numeric', 'min:0'],
        ]);

        $component->update($validated);

        return response()->json($component);
    }

    public function destroy(Component $component)
    {
        $component->delete();

        return response()->json(null, 204);
    }
}
