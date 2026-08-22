<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Operator;
use Illuminate\Http\Request;

class OperatorController extends Controller
{
    public function index()
    {
        return response()->json(Operator::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_code' => ['required', 'string', 'unique:operators,employee_code'],
            'name' => ['required', 'string'],
            'shift' => ['nullable', 'string'],
            'hired_at' => ['nullable', 'date'],
            'photo_url' => ['nullable', 'string'],
        ]);

        $operator = Operator::create($validated);

        return response()->json($operator, 201);
    }

    public function show(Operator $operator)
    {
        return response()->json(
            $operator->load(['haulTrips' => fn ($q) => $q->orderByDesc('started_at')->limit(20)])
        );
    }

    public function update(Request $request, Operator $operator)
    {
        $validated = $request->validate([
            'employee_code' => ['sometimes', 'string', 'unique:operators,employee_code,'.$operator->id],
            'name' => ['sometimes', 'string'],
            'shift' => ['nullable', 'string'],
            'hired_at' => ['nullable', 'date'],
            'photo_url' => ['nullable', 'string'],
        ]);

        $operator->update($validated);

        return response()->json($operator);
    }

    public function destroy(Operator $operator)
    {
        $operator->delete();

        return response()->json(null, 204);
    }
}
