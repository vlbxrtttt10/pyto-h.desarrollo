<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSensorReadingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'equipment_id' => ['required', 'exists:equipments,id'],
            'component_id' => ['required', 'exists:components,id'],
            'temperature_celsius' => ['required', 'numeric'],
            'pressure_psi' => ['required', 'numeric', 'min:0'],
            'grease_level_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'read_at' => ['required', 'date'],
            'source' => ['sometimes', 'string'],
        ];
    }
}
