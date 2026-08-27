<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class EquipmentFactory extends Factory
{
    public function definition(): array
    {
        static $sequence = 1;

        $type = $this->faker->randomElement(['ULM', 'ULP', 'UMO', 'ULE']);

        $modelsByType = [
            'ULM' => ['Cisterna Frontal', 'Furgon Lateral'],
            'ULP' => ['Sinchi', 'Sampa110', 'Sampa120', 'Sampa140'],
            'UMO' => ['Ukumari MH30C', 'Pusak'],
            'ULE' => ['Estacion Fija Kronos'],
        ];

        return [
            'code' => $type.'-'.str_pad((string) $sequence++, 3, '0', STR_PAD_LEFT),
            'type' => $type,
            'model' => $this->faker->randomElement($modelsByType[$type]),
            'client' => $this->faker->randomElement([
                'Antamina', 'MMG Las Bambas', 'Cerro Verde', 'Yanacocha', 'Minsur', 'Ferreyros',
            ]),
            'site' => $this->faker->randomElement(['Tajo Norte', 'Tajo Sur', 'Planta Concentradora', 'Taller Central']),
            'criticality' => $this->faker->randomElement(['alta', 'alta', 'media', 'baja']),
            'install_date' => $this->faker->dateTimeBetween('-4 years', '-3 months'),
            'status' => 'operativo',
        ];
    }
}
