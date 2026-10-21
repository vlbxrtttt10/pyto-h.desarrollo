<?php

namespace App\Exports;

use App\Models\EquipmentAnomaly;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AnomaliesExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithColumnWidths
{
    public function __construct(private ?string $from = null, private ?string $to = null)
    {
    }

    public function collection()
    {
        $query = EquipmentAnomaly::with([
            'sensorReading.equipmentComponent.equipment',
            'sensorReading.equipmentComponent.component',
        ])->orderBy('created_at');

        if ($this->from) {
            $query->whereHas('sensorReading', fn ($q) => $q->where('read_at', '>=', $this->from));
        }

        if ($this->to) {
            $query->whereHas('sensorReading', fn ($q) => $q->where('read_at', '<=', $this->to));
        }

        return $query->get();
    }

    public function headings(): array
    {
        return [
            'Fecha',
            'Equipo',
            'Cliente',
            'Componente',
            'Causa',
            'Severidad',
            'Horas de downtime evitadas',
        ];
    }

    public function map($anomaly): array
    {
        $equipment = $anomaly->sensorReading?->equipmentComponent?->equipment;
        $component = $anomaly->sensorReading?->equipmentComponent?->component;

        return [
            optional($anomaly->sensorReading?->read_at)->format('Y-m-d H:i'),
            $equipment?->code,
            $equipment?->client,
            $component?->name,
            $anomaly->cause,
            $anomaly->severity,
            (float) $anomaly->estimated_downtime_hours,
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 18,
            'B' => 12,
            'C' => 22,
            'D' => 20,
            'E' => 18,
            'F' => 14,
            'G' => 14,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
