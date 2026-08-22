<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Truck;
use Illuminate\Http\Request;

class TruckController extends Controller
{
    public function index()
    {
        return response()->json(Truck::orderBy('code')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'model' => ['required', 'string'],
            'tank_capacity_liters' => ['required', 'numeric', 'min:0'],
            'empty_weight_tons' => ['required', 'numeric', 'min:0'],
            'max_payload_tons' => ['required', 'numeric', 'min:0'],
            'status' => ['sometimes', 'in:active,maintenance,inactive'],
        ]);

        $validated['code'] = $this->nextCode();

        $truck = Truck::create($validated);

        return response()->json($truck, 201);
    }

    private function nextCode(): string
    {
        $lastNumber = Truck::query()
            ->selectRaw("MAX(CAST(SUBSTRING(code, 5) AS UNSIGNED)) as last_number")
            ->where('code', 'like', 'CAM-%')
            ->value('last_number');

        return sprintf('CAM-%03d', ($lastNumber ?? 0) + 1);
    }

    public function show(Truck $truck)
    {
        return response()->json($truck->load(['haulTrips', 'mechanicalAlerts']));
    }

    public function update(Request $request, Truck $truck)
    {
        $validated = $request->validate([
            'code' => ['sometimes', 'string', 'unique:trucks,code,'.$truck->id],
            'model' => ['sometimes', 'string'],
            'tank_capacity_liters' => ['sometimes', 'numeric', 'min:0'],
            'empty_weight_tons' => ['sometimes', 'numeric', 'min:0'],
            'max_payload_tons' => ['sometimes', 'numeric', 'min:0'],
            'status' => ['sometimes', 'in:active,maintenance,inactive'],
        ]);

        $truck->update($validated);

        return response()->json($truck);
    }

    public function destroy(Truck $truck)
    {
        $truck->delete();

        return response()->json(null, 204);
    }
}
