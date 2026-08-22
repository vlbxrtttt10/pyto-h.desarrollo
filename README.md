# Aleri

Sistema predictivo de eficiencia energetica y combustible para flotas de camiones mineros (haul trucks). Detecta anomalias de consumo en tiempo real, explica su causa (ralenti excesivo, conduccion agresiva, uso incorrecto de marchas o posible falla mecanica), y gamifica el ranking de eco-conduccion de los operadores.

## Arquitectura

- `backend/` — API REST en Laravel 12 + MySQL + Sanctum (auth por token).
- `frontend/` — SPA en React 19 + Vite + Tailwind CSS v4, consume la API via Axios.

El motor de deteccion de anomalias (`app/Services/FuelIntelligenceService.php`) calcula el consumo de combustible esperado por viaje segun peso, distancia y pendiente de la ruta, lo compara contra el consumo real, y atribuye la causa dominante de cualquier desviacion relevante (>=15%). Si varios viajes recientes de un camion muestran sobreconsumo sin causa de habito, se genera una alerta preventiva de posible falla mecanica.

## Requisitos

- PHP 8.2+, Composer
- MySQL / MariaDB corriendo en `127.0.0.1:3306`
- Node.js 20+, npm

## Backend

```bash
cd backend
composer install
cp .env.example .env   # si no existe ya
php artisan key:generate

# Crear la base de datos (una sola vez). El nombre interno "fuelpulse_mining" es
# el identificador tecnico original del proyecto y no afecta el branding "Aleri":
mysql -u root -e "CREATE DATABASE IF NOT EXISTS fuelpulse_mining CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

php artisan migrate --seed
php artisan serve   # http://localhost:8000
```

Usuario semilla para login: `admin@aleri.mining` / `password`

Variables clave en `backend/.env`:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=fuelpulse_mining
DB_USERNAME=root
DB_PASSWORD=

FRONTEND_URL=http://localhost:5173
```

## Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

Variable clave en `frontend/.env`:

```
VITE_API_URL=http://localhost:8000/api
```

## Datos de ejemplo

El seeder (`database/seeders/DatabaseSeeder.php`) genera 8 camiones, 12 operadores, 4 rutas y ~150-200 viajes con distribucion realista de anomalias (ralenti, conduccion agresiva, marchas incorrectas) y un camion con patron de falla mecanica simulado para disparar una alerta preventiva automatica.

Para regenerar los datos desde cero:

```bash
cd backend
php artisan migrate:fresh --seed
```
