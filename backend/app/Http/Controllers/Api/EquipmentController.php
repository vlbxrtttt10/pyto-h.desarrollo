<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use Illuminate\Http\Request;

class EquipmentController extends Controller
{
    public function index()
    {
        return response()->json(Equipment::orderBy('code')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => ['required', 'in:ULM,ULP,UMO,ULE'],
            'model' => ['required', 'string'],
            'client' => ['required', 'string'],
            'site' => ['nullable', 'string'],
            'criticality' => ['sometimes', 'in:alta,media,baja'],
            'install_date' => ['nullable', 'date'],
            'status' => ['sometimes', 'in:operativo,en_falla,en_mantenimiento,paro_emergencia'],
        ]);

        $validated['code'] = $this->nextCode($validated['type']);

        $equipment = Equipment::create($validated);

        return response()->json($equipment, 201);
    }

    private function nextCode(string $type): string
    {
        $lastNumber = Equipment::query()
            ->selectRaw('MAX(CAST(SUBSTRING(code, 5) AS UNSIGNED)) as last_number')
            ->where('code', 'like', $type.'-%')
            ->value('last_number');

        return sprintf('%s-%03d', $type, ($lastNumber ?? 0) + 1);
    }

    public function show(Equipment $equipment)
    {
        $equipment->load([
            'equipmentComponents.component',
            'sensorReadings' => fn ($q) => $q->with(['equipmentComponent.component', 'equipmentAnomalies'])->orderByDesc('read_at'),
            'maintenanceAlerts',
        ]);

        $equipment->equipmentComponents->each(function ($equipmentComponent) {
            $lifetimeHours = $equipmentComponent->component?->expected_lifetime_hours;

            if (! $lifetimeHours || ! $equipmentComponent->installed_at) {
                $equipmentComponent->lifetime_hours_used = null;
                $equipmentComponent->lifetime_percent_used = null;

                return;
            }

            $hoursUsed = $equipmentComponent->installed_at->diffInHours(now());
            $percentUsed = min(100, round(($hoursUsed / $lifetimeHours) * 100, 1));

            $equipmentComponent->lifetime_hours_used = $hoursUsed;
            $equipmentComponent->lifetime_percent_used = $percentUsed;
        });

        return response()->json($equipment);
    }

    public function update(Request $request, Equipment $equipment)
    {
        $validated = $request->validate([
            'type' => ['sometimes', 'in:ULM,ULP,UMO,ULE'],
            'model' => ['sometimes', 'string'],
            'client' => ['sometimes', 'string'],
            'site' => ['nullable', 'string'],
            'criticality' => ['sometimes', 'in:alta,media,baja'],
            'install_date' => ['nullable', 'date'],
            'status' => ['sometimes', 'in:operativo,en_falla,en_mantenimiento,paro_emergencia'],
        ]);

        $equipment->update($validated);

        return response()->json($equipment);
    }

    public function destroy(Equipment $equipment)
    {
        $equipment->delete();

        return response()->json(null, 204);
    }
}
