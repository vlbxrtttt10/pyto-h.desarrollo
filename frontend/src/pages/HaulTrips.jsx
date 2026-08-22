import { useEffect, useState } from 'react'
import { haulTripsApi, trucksApi, operatorsApi, haulRoutesApi } from '../api/resources'
import Loader from '../components/Loader'
import Modal from '../components/Modal'
import Notify, { Confirm } from '../lib/notify'
import { CauseBadge, SeverityBadge } from '../components/Badge'

const emptyForm = {
  truck_id: '',
  operator_id: '',
  haul_route_id: '',
  started_at: '',
  ended_at: '',
  payload_tons: '',
  idle_minutes: '',
  driving_minutes: '',
  harsh_braking_events: '',
  harsh_acceleration_events: '',
  wrong_gear_events: '',
  avg_speed_kmh: '',
  fuel_consumed_liters: '',
}

// Misma formula que FuelIntelligenceService::calculateExpectedFuel en el backend,
// para mostrarle al usuario el litraje esperado en vivo antes de guardar el viaje.
const IDLE_LITERS_PER_MINUTE = 0.9
const NORMAL_IDLE_MINUTES = 5
const GRADE_PENALTY_FACTOR = 0.045
const ANOMALY_THRESHOLD_PERCENT = 15.0

function calculateExpectedFuel(truck, route, payloadTons) {
  if (!truck || !route || !payloadTons) return null

  const totalWeightTons = Number(truck.empty_weight_tons) + Number(payloadTons)
  let base = Number(route.base_liters_per_ton_km) * totalWeightTons * Number(route.distance_km)

  const grade = Number(route.average_grade_percent)
  if (grade > 0) {
    base *= 1 + grade * GRADE_PENALTY_FACTOR
  }

  return base + NORMAL_IDLE_MINUTES * IDLE_LITERS_PER_MINUTE
}

export default function HaulTrips() {
  const [trips, setTrips] = useState(null)
  const [page, setPage] = useState(1)
  const [trucks, setTrucks] = useState([])
  const [operators, setOperators] = useState([])
  const [haulRoutes, setHaulRoutes] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  function load() {
    setTrips(null)
    haulTripsApi.list({ page }).then((res) => setTrips(res.data))
  }

  useEffect(() => {
    load()
  }, [page])

  useEffect(() => {
    trucksApi.list().then((res) => setTrucks(res.data))
    operatorsApi.list().then((res) => setOperators(res.data))
    haulRoutesApi.list().then((res) => setHaulRoutes(res.data))
  }, [])

  function openModal() {
    setForm(emptyForm)
    setError(null)
    setModalOpen(true)
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const selectedTruck = trucks.find((t) => String(t.id) === String(form.truck_id))
  const selectedRoute = haulRoutes.find((r) => String(r.id) === String(form.haul_route_id))
  const expectedFuel = calculateExpectedFuel(selectedTruck, selectedRoute, form.payload_tons)
  const fuelDeviation =
    expectedFuel && form.fuel_consumed_liters
      ? ((Number(form.fuel_consumed_liters) - expectedFuel) / expectedFuel) * 100
      : null

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await haulTripsApi.create(form)
      setModalOpen(false)
      Notify.success('Viaje registrado correctamente')
      setPage(1)
      load()
    } catch (err) {
      const message = err.response?.data?.message || 'No se pudo registrar el viaje.'
      setError(message)
      Notify.failure(message)
    } finally {
      setSaving(false)
    }
  }

  function handleDelete(trip) {
    Confirm.show(
      'Eliminar viaje',
      `¿Estas seguro de eliminar este viaje de ${trip.truck?.code}? Esta accion no se puede deshacer.`,
      'Si, eliminar',
      'Cancelar',
      async () => {
        try {
          await haulTripsApi.remove(trip.id)
          Notify.success('Viaje eliminado')
          load()
        } catch (err) {
          Notify.failure(err.response?.data?.message || 'No se pudo eliminar el viaje.')
        }
      },
      () => {},
    )
  }

  if (!trips) return <Loader label="Cargando viajes..." />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            <i className="bx bx-trip text-violet-400" />
            Viajes de acarreo
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Historial de viajes con el consumo real vs. el esperado por la IA.
          </p>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <i className="bx bx-plus text-base" />
          Nuevo viaje
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Camion</th>
              <th className="px-4 py-3">Operador</th>
              <th className="px-4 py-3">Ruta</th>
              <th className="px-4 py-3">Real (L)</th>
              <th className="px-4 py-3">Esperado (L)</th>
              <th className="px-4 py-3">Desviacion</th>
              <th className="px-4 py-3">Anomalia</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {trips.data.map((trip) => (
              <tr key={trip.id}>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {new Date(trip.started_at).toLocaleString('es-PE', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </td>
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{trip.truck?.code}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{trip.operator?.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{trip.haul_route?.name}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{Number(trip.fuel_consumed_liters).toFixed(1)}</td>
                <td className="px-4 py-3 text-slate-500">{Number(trip.expected_fuel_liters).toFixed(1)}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      trip.deviation_percent > 15
                        ? 'font-semibold text-rose-600 dark:text-rose-400'
                        : trip.deviation_percent > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-brand-600 dark:text-brand-400'
                    }
                  >
                    {Number(trip.deviation_percent).toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  {trip.fuel_anomalies?.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <CauseBadge cause={trip.fuel_anomalies[0].cause} />
                      <SeverityBadge severity={trip.fuel_anomalies[0].severity} />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600">Normal</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(trip)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300"
                  >
                    <i className="bx bx-trash text-sm" />
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Pagina {trips.current_page} de {trips.last_page} · {trips.total} viajes
        </span>
        <div className="flex gap-2">
          <button
            disabled={trips.current_page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
          >
            <i className="bx bx-chevron-left text-sm" />
            Anterior
          </button>
          <button
            disabled={trips.current_page >= trips.last_page}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
          >
            Siguiente
            <i className="bx bx-chevron-right text-sm" />
          </button>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo viaje de acarreo" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Camion</label>
              <select
                required
                autoFocus
                value={form.truck_id}
                onChange={(e) => update('truck_id', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Selecciona...</option>
                {trucks.map((truck) => (
                  <option key={truck.id} value={truck.id}>{truck.code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Operador</label>
              <select
                required
                value={form.operator_id}
                onChange={(e) => update('operator_id', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Selecciona...</option>
                {operators.map((operator) => (
                  <option key={operator.id} value={operator.id}>{operator.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Ruta</label>
              <select
                required
                value={form.haul_route_id}
                onChange={(e) => update('haul_route_id', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Selecciona...</option>
                {haulRoutes.map((route) => (
                  <option key={route.id} value={route.id}>{route.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Inicio del viaje</label>
              <input
                required
                type="datetime-local"
                value={form.started_at}
                onChange={(e) => update('started_at', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Fin del viaje</label>
              <input
                required
                type="datetime-local"
                value={form.ended_at}
                onChange={(e) => update('ended_at', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Carga (t)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.payload_tons}
                onChange={(e) => update('payload_tons', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Velocidad prom. (km/h)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.avg_speed_kmh}
                onChange={(e) => update('avg_speed_kmh', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Combustible real (L)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.fuel_consumed_liters}
                onChange={(e) => update('fuel_consumed_liters', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {expectedFuel !== null && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs dark:border-violet-500/20 dark:bg-violet-500/10">
              <span className="text-violet-700 dark:text-violet-300">
                <i className="bx bx-calculator mr-1" />
                Esperado por la IA: <strong>{expectedFuel.toFixed(1)} L</strong>
              </span>
              {fuelDeviation !== null && (
                <span
                  className={
                    fuelDeviation >= ANOMALY_THRESHOLD_PERCENT
                      ? 'font-semibold text-rose-600 dark:text-rose-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }
                >
                  Desviacion estimada: {fuelDeviation.toFixed(1)}%
                  {fuelDeviation >= ANOMALY_THRESHOLD_PERCENT ? ' · generara anomalia' : ''}
                </span>
              )}
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Comportamiento del operador durante el viaje
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Minutos en ralenti</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.idle_minutes}
                  onChange={(e) => update('idle_minutes', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Minutos en marcha</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.driving_minutes}
                  onChange={(e) => update('driving_minutes', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Marchas incorrectas</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.wrong_gear_events}
                  onChange={(e) => update('wrong_gear_events', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Frenadas bruscas</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.harsh_braking_events}
                  onChange={(e) => update('harsh_braking_events', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Aceleraciones bruscas</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.harsh_acceleration_events}
                  onChange={(e) => update('harsh_acceleration_events', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              <i className="bx bx-plus text-base" />
              {saving ? 'Guardando...' : 'Registrar viaje'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
