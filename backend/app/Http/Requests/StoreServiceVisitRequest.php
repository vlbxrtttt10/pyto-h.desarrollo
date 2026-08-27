<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreServiceVisitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'equipment_id' => ['required', 'exists:equipments,id'],
            'technician_id' => ['required', 'exists:technicians,id'],
            'component_id' => ['required', 'exists:components,id'],
            'type' => ['required', 'in:preventivo,correctivo,instalacion'],
            'visited_at' => ['required', 'date'],
            'pump_pressure_psi' => ['required', 'numeric', 'min:0'],
            'dispensed_volume_liters' => ['required', 'numeric', 'min:0'],
            'cycle_time_minutes' => ['required', 'numeric', 'min:0'],
            'operating_hours' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'parts_used' => ['nullable', 'string'],
        ];
    }
}
