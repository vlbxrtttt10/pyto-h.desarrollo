// Simulador del controlador (Node.js) que leeria los PLCs/sensores instalados
// en los camiones lubricadores y unidades hidraulicas de Hydromaq.
//
// Mientras no hay PLCs reales conectados, este script genera lecturas
// periodicas de temperatura, presion y nivel de grasa (normales o con una
// falla simulada) y las envia al mismo endpoint que usaria el controlador
// real: POST /api/sensor-readings.

import 'dotenv/config'
import axios from 'axios'

const API_URL = process.env.ALERI_API_URL || 'http://127.0.0.1:8000/api'
const EMAIL = process.env.ALERI_EMAIL || 'admin@aleri.mining'
const PASSWORD = process.env.ALERI_PASSWORD || 'password'
const INTERVAL_MS = Number(process.env.READING_INTERVAL_MS || 8000)
const FAILURE_CHANCE_PERCENT = Number(process.env.FAILURE_CHANCE_PERCENT || 20)

const client = axios.create({ baseURL: API_URL })

function log(message) {
  const timestamp = new Date().toLocaleTimeString()
  console.log(`[${timestamp}] ${message}`)
}

async function login() {
  log(`Autenticando como ${EMAIL} en ${API_URL} ...`)
  const { data } = await client.post('/auth/login', { email: EMAIL, password: PASSWORD })
  client.defaults.headers.common.Authorization = `Bearer ${data.token}`
  log(`Autenticado correctamente (usuario: ${data.user.name}).`)
}

async function fetchFleet() {
  const [equipmentsRes, componentsRes] = await Promise.all([
    client.get('/equipments'),
    client.get('/components'),
  ])

  if (equipmentsRes.data.length === 0 || componentsRes.data.length === 0) {
    throw new Error('No hay equipos o componentes cargados en Aleri. Corre el seeder del backend primero (php artisan migrate:fresh --seed).')
  }

  return { equipments: equipmentsRes.data, components: componentsRes.data }
}

function randomBetween(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100
}

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)]
}

/**
 * Genera una lectura para un componente. La mayoria de las veces cae dentro
 * de su rango normal; con la probabilidad configurada, simula una falla
 * puntual (sobrecalentamiento, sobrepresion o bajo nivel de grasa) para
 * poder ver el flujo completo de deteccion + alerta + Telegram en accion.
 */
function generateReading(component) {
  const isFailure = Math.random() * 100 < FAILURE_CHANCE_PERCENT
  const failureType = isFailure ? randomItem(['overheating', 'overpressure', 'low_grease_level']) : null

  const normalTemperature = randomBetween(Number(component.min_temperature_celsius), Number(component.max_temperature_celsius))
  const normalPressure = randomBetween(Number(component.min_pressure_psi), Number(component.max_pressure_psi))
  const normalGrease = randomBetween(Number(component.min_grease_level_percent) + 10, 95)

  const values = {
    temperature_celsius: normalTemperature,
    pressure_psi: normalPressure,
    grease_level_percent: normalGrease,
  }

  if (failureType === 'overheating') {
    values.temperature_celsius = round2(Number(component.max_temperature_celsius) * randomBetween(1.15, 1.4))
  } else if (failureType === 'overpressure') {
    values.pressure_psi = round2(Number(component.max_pressure_psi) * randomBetween(1.1, 1.3))
  } else if (failureType === 'low_grease_level') {
    values.grease_level_percent = round2(Number(component.min_grease_level_percent) * randomBetween(0.3, 0.7))
  }

  return { values, failureType }
}

function round2(value) {
  return Math.round(value * 100) / 100
}

async function sendReading(equipment, component) {
  const { values, failureType } = generateReading(component)

  const payload = {
    equipment_id: equipment.id,
    component_id: component.id,
    read_at: new Date().toISOString(),
    ...values,
  }

  const { data } = await client.post('/sensor-readings', payload)

  const anomaly = data.equipment_anomalies?.[0]
  const label = `${equipment.code} (${equipment.client}) · ${component.name}`

  if (anomaly) {
    log(`⚠️  ${label} → ANOMALIA detectada: ${anomaly.cause} (${anomaly.severity})${failureType ? ' [falla simulada]' : ''}`)
  } else {
    log(`✅ ${label} → lectura normal (T=${values.temperature_celsius}°C, P=${values.pressure_psi} PSI, Grasa=${values.grease_level_percent}%)`)
  }
}

async function tick(fleet) {
  const equipment = randomItem(fleet.equipments)
  const component = randomItem(fleet.components)

  try {
    await sendReading(equipment, component)
  } catch (err) {
    const message = err.response?.data?.message || err.message
    log(`❌ Error enviando lectura: ${message}`)
  }
}

async function main() {
  log('Simulador de sensores Aleri (PLC -> API) iniciando...')
  await login()
  const fleet = await fetchFleet()
  log(`Flota cargada: ${fleet.equipments.length} equipos, ${fleet.components.length} componentes.`)
  log(`Enviando una lectura cada ${INTERVAL_MS / 1000}s (probabilidad de falla simulada: ${FAILURE_CHANCE_PERCENT}%). Ctrl+C para detener.`)

  await tick(fleet)
  setInterval(() => tick(fleet), INTERVAL_MS)
}

main().catch((err) => {
  console.error('El simulador no pudo iniciar:', err.response?.data?.message || err.message)
  process.exit(1)
})
