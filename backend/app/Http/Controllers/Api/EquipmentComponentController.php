<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\EquipmentComponent;
use Illuminate\Http\Request;

class EquipmentComponentController extends Controller
{
    public function index(Equipment $equipment)
    {
        return response()->json(
            $equipment->equipmentComponents()->with('component')->get()
        );
    }

    public function store(Request $request, Equipment $equipment)
    {
        $validated = $request->validate([
            'component_id' => [
                'required',
                'exists:components,id',
                'unique:equipment_components,component_id,NULL,id,equipment_id,'.$equipment->id,
            ],
            'installed_at' => ['nullable', 'date'],
        ]);

        $equipmentComponent = $equipment->equipmentComponents()->create($validated);

        return response()->json($equipmentComponent->load('component'), 201);
    }

    public function destroy(Equipment $equipment, EquipmentComponent $equipmentComponent)
    {
        abort_unless($equipmentComponent->equipment_id === $equipment->id, 404);

        $equipmentComponent->delete();

        return response()->json(null, 204);
    }
}
