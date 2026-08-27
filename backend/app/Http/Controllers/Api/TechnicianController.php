<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Technician;
use Illuminate\Http\Request;

class TechnicianController extends Controller
{
    public function index()
    {
        return response()->json(Technician::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_code' => ['required', 'string', 'unique:technicians,employee_code'],
            'name' => ['required', 'string'],
            'specialty' => ['nullable', 'string'],
            'hired_at' => ['nullable', 'date'],
            'photo_url' => ['nullable', 'string'],
        ]);

        $technician = Technician::create($validated);

        return response()->json($technician, 201);
    }

    public function show(Technician $technician)
    {
        return response()->json(
            $technician->load(['serviceVisits' => fn ($q) => $q->with(['equipment', 'component'])->orderByDesc('visited_at')->limit(20)])
        );
    }

    public function update(Request $request, Technician $technician)
    {
        $validated = $request->validate([
            'employee_code' => ['sometimes', 'string', 'unique:technicians,employee_code,'.$technician->id],
            'name' => ['sometimes', 'string'],
            'specialty' => ['nullable', 'string'],
            'hired_at' => ['nullable', 'date'],
            'photo_url' => ['nullable', 'string'],
        ]);

        $technician->update($validated);

        return response()->json($technician);
    }

    public function destroy(Technician $technician)
    {
        $technician->delete();

        return response()->json(null, 204);
    }
}
