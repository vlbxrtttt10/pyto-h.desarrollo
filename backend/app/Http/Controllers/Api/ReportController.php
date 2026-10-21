<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EquipmentAnomaly;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function monthlyDowntime(Request $request)
    {
        $months = (int) $request->query('months', 12);
        $months = max(1, min($months, 24));

        $since = now()->subMonths($months - 1)->startOfMonth();

        $rows = EquipmentAnomaly::query()
            ->join('sensor_readings', 'sensor_readings.id', '=', 'equipment_anomalies.sensor_reading_id')
            ->where('sensor_readings.read_at', '>=', $since)
            ->selectRaw("DATE_FORMAT(sensor_readings.read_at, '%Y-%m') as month, SUM(equipment_anomalies.estimated_downtime_hours) as total, COUNT(*) as anomaly_count")
            ->groupBy('month')
            ->pluck('total', 'month');

        $counts = EquipmentAnomaly::query()
            ->join('sensor_readings', 'sensor_readings.id', '=', 'equipment_anomalies.sensor_reading_id')
            ->where('sensor_readings.read_at', '>=', $since)
            ->selectRaw("DATE_FORMAT(sensor_readings.read_at, '%Y-%m') as month, COUNT(*) as total")
            ->groupBy('month')
            ->pluck('total', 'month');

        $series = collect();
        for ($i = $months - 1; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $key = $date->format('Y-m');

            $series->push([
                'month' => $key,
                'label' => $date->translatedFormat('M Y'),
                'downtime_hours_avoided' => round((float) ($rows[$key] ?? 0), 2),
                'anomaly_count' => (int) ($counts[$key] ?? 0),
            ]);
        }

        return response()->json($series->values());
    }

    public function exportAnomalies(Request $request): StreamedResponse
    {
        $from = $request->query('from');
        $to = $request->query('to');

        $query = EquipmentAnomaly::with([
            'sensorReading.equipmentComponent.equipment',
            'sensorReading.equipmentComponent.component',
        ])->orderBy('created_at');

        if ($from) {
            $query->whereHas('sensorReading', fn ($q) => $q->where('read_at', '>=', $from));
        }

        if ($to) {
            $query->whereHas('sensorReading', fn ($q) => $q->where('read_at', '<=', $to));
        }

        $filename = 'reporte-anomalias-'.now()->format('Y-m-d').'.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');

            fputs($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'Fecha',
                'Equipo',
                'Cliente',
                'Componente',
                'Causa',
                'Severidad',
                'Horas de downtime evitadas',
            ]);

            $query->chunk(200, function ($anomalies) use ($handle) {
                foreach ($anomalies as $anomaly) {
                    $equipment = $anomaly->sensorReading?->equipmentComponent?->equipment;
                    $component = $anomaly->sensorReading?->equipmentComponent?->component;

                    fputcsv($handle, [
                        optional($anomaly->sensorReading?->read_at)->format('Y-m-d H:i'),
                        $equipment?->code,
                        $equipment?->client,
                        $component?->name,
                        $anomaly->cause,
                        $anomaly->severity,
                        $anomaly->estimated_downtime_hours,
                    ]);
                }
            });

            fclose($handle);
        }, $filename, $headers);
    }
}
