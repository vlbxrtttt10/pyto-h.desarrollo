# Aleri

Sistema de mantenimiento predictivo para la flota de equipos de campo de Hydromaq (camiones lubricadores y unidades hidraulicas). Recibe lecturas de sensores (temperatura, presion, nivel de grasa), detecta automaticamente condiciones fuera de rango (sobrecalentamiento, sobrepresion, bajo nivel de grasa), abre alertas de mantenimiento cuando el patron se sostiene en varias lecturas consecutivas, y notifica al instante por Telegram — con un boton para marcar el equipo como detenido directamente desde el chat.

## Arquitectura

- `backend/` — API REST en Laravel 12 + MySQL + Sanctum (auth por token) + Reverb (WebSockets).
- `frontend/` — SPA en React 19 + Vite + Tailwind CSS v4, consume la API via Axios y escucha eventos en tiempo real via Laravel Echo.

El motor de deteccion (`app/Services/SensorMonitoringService.php`) compara cada lectura de sensor contra el rango normal definido para su componente. Si esta fuera de rango, registra una anomalia; si la mayoria de las ultimas 3 lecturas de un equipo muestran anomalias, abre (o refresca) una alerta de mantenimiento y dispara una notificacion por Telegram (`app/Services/TelegramNotifier.php`), con un boton inline para detener el equipo desde el propio chat.

## Requisitos

- PHP 8.2+, Composer
- MySQL / MariaDB corriendo en `127.0.0.1:3306` (por ejemplo, via XAMPP)
- Node.js 20+, npm
- Un bot de Telegram creado con [@BotFather](https://t.me/BotFather) (token + chat_id)

## Backend

```bash
cd backend
composer install
cp .env.example .env   # si no existe ya
php artisan key:generate

# Crear la base de datos (una sola vez):
mysql -u root -e "CREATE DATABASE IF NOT EXISTS fuelpulse_mining CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

php artisan migrate --seed
```

Usuario semilla para login: `admin@aleri.mining` / `password`

El seeder por defecto (`DatabaseSeeder`) solo crea ese usuario. Para poblar la flota con datos de ejemplo (equipos, componentes y lecturas simuladas) corre ademas:

```bash
php artisan db:seed --class=DemoDataSeeder
```

Variables clave en `backend/.env`:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=fuelpulse_mining
DB_USERNAME=root
DB_PASSWORD=

FRONTEND_URL=http://localhost:5173

TELEGRAM_BOT_TOKEN=   # token del bot creado con @BotFather
TELEGRAM_CHAT_ID=     # chat_id donde llegan las alertas

BROADCAST_CONNECTION=reverb
REVERB_APP_ID=
REVERB_APP_KEY=
REVERB_APP_SECRET=
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
```

## Frontend

```bash
cd frontend
npm install
```

Variables clave en `frontend/.env`:

```
VITE_API_URL=http://localhost:8000/api

VITE_REVERB_APP_KEY=   # igual al REVERB_APP_KEY del backend
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

## Levantar el sistema completo

El sistema necesita 4 procesos corriendo en paralelo, cada uno en su propia terminal:

```bash
# 1. Backend (API)
cd backend && php artisan serve            # http://127.0.0.1:8000

# 2. Frontend (SPA)
cd frontend && npm run dev                 # http://localhost:5173

# 3. Reverb (WebSockets, para el Dashboard en tiempo real)
cd backend && php artisan reverb:start     # puerto 8080

# 4. Poll de Telegram (procesa el boton "Detener equipo" del chat)
cd backend && php artisan telegram:poll
```

Sin el paso 3, el Dashboard sigue funcionando pero no se actualiza solo (hay que recargar la pagina a mano). Sin el paso 4, las alertas llegan a Telegram normalmente pero tocar el boton "Detener equipo" no tiene efecto hasta que el comando corra y lo procese.

## Flujo de datos (resumen)

1. Un sensor/PLC (simulado desde el panel de la pagina "Lecturas de sensores", o via `POST /api/sensor-readings`) reporta una lectura.
2. `SensorMonitoringService` la compara contra el rango normal del componente y registra una anomalia si corresponde.
3. Si el patron se sostiene en varias lecturas seguidas, se abre una `MaintenanceAlert` y se notifica por Telegram.
4. Desde Telegram, el boton "Detener equipo" (procesado por `telegram:poll`) marca el equipo como `en_falla` y la alerta como `acknowledged`.
5. Cualquiera de estos eventos dispara `DashboardUpdated`, que via Reverb actualiza el Dashboard del frontend en tiempo real, sin recargar la pagina.

Mas detalle visual del flujo completo esta disponible dentro del sistema en la pagina **Reportes**.
