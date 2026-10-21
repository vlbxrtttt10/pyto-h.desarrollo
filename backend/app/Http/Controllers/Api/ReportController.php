<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EquipmentAnomaly;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
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
