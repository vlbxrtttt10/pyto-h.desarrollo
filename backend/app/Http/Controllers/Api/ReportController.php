<?php

namespace App\Http\Controllers\Api;

use App\Exports\AnomaliesExport;
use App\Http\Controllers\Controller;
use App\Models\EquipmentAnomaly;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

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

    public function exportAnomalies(Request $request)
    {
        $from = $request->query('from');
        $to = $request->query('to');

        $filename = 'reporte-anomalias-'.now()->format('Y-m-d').'.xlsx';

        return Excel::download(new AnomaliesExport($from, $to), $filename);
    }
}
