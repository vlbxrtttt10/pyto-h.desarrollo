<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreHaulTripRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'truck_id' => ['required', 'exists:trucks,id'],
            'operator_id' => ['required', 'exists:operators,id'],
            'haul_route_id' => ['required', 'exists:haul_routes,id'],
            'started_at' => ['required', 'date'],
            'ended_at' => ['required', 'date', 'after:started_at'],
            'payload_tons' => ['required', 'numeric', 'min:0'],
            'idle_minutes' => ['required', 'integer', 'min:0'],
            'driving_minutes' => ['required', 'integer', 'min:0'],
            'harsh_braking_events' => ['required', 'integer', 'min:0'],
            'harsh_acceleration_events' => ['required', 'integer', 'min:0'],
            'wrong_gear_events' => ['required', 'integer', 'min:0'],
            'avg_speed_kmh' => ['required', 'numeric', 'min:0'],
            'fuel_consumed_liters' => ['required', 'numeric', 'min:0'],
        ];
    }
}
