import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { serviceVisitsApi, equipmentsApi, techniciansApi, componentsApi } from '../../api/resources'
import Notify from '../../lib/notify'

const emptyForm = {
  equipment_id: '',
  technician_id: '',
  component_id: '',
  type: 'preventivo',
  visited_at: '',
  pump_pressure_psi: '',
  dispensed_volume_liters: '',
  cycle_time_minutes: '',
  operating_hours: '',
  notes: '',
  parts_used: '',
}

// Misma logica que MaintenanceIntelligenceService::calculateDeviation en el
// backend, para mostrarle al tecnico la desviacion esperada antes de guardar.
const PRESSURE_WEIGHT = 0.5
const VOLUME_WEIGHT = 0.3
const CYCLE_TIME_WEIGHT = 0.2
const ANOMALY_THRESHOLD_PERCENT = 15.0

function percentDeviation(actual, expected) {
  if (!expected) return 0
  return Math.abs((actual - expected) / expected) * 100
}

function calculateDeviation(component, form) {
  if (!component || !form.pump_pressure_psi || !form.dispensed_volume_liters || !form.cycle_time_minutes) return null

  const pressureDeviation = percentDeviation(Number(form.pump_pressure_psi), Number(component.expected_pressure_psi))
  const volumeDeviation = percentDeviation(Number(form.dispensed_volume_liters), Number(component.expected_volume_liters))
  const cycleDeviation = percentDeviation(Number(form.cycle_time_minutes), Number(component.expected_cycle_minutes))

  return pressureDeviation * PRESSURE_WEIGHT + volumeDeviation * VOLUME_WEIGHT + cycleDeviation * CYCLE_TIME_WEIGHT
}

export default function VisitaCreate() {
  const navigate = useNavigate()
  const [equipos, setEquipos] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [componentes, setComponentes] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    Promise.all([equipmentsApi.list(), techniciansApi.list(), componentsApi.list()])
      .then(([equiposRes, tecnicosRes, componentesRes]) => {
        setEquipos(equiposRes.data)
        setTecnicos(tecnicosRes.data)
        setComponentes(componentesRes.data)
      })
      .catch((err) => setLoadError(err.response?.data?.message || 'No se pudieron cargar los datos del formulario.'))
  }, [])

  const selectedComponent = componentes.find((c) => String(c.id) === String(form.component_id))
  const deviation = calculateDeviation(selectedComponent, form)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await serviceVisitsApi.create(form)
      Notify.success('Visita registrada correctamente')
      navigate('/visitas')
    } catch (err) {
      const message = err.response?.data?.message || 'No se pudo registrar la visita.'
      setError(message)
      Notify.failure(message)
    } finally {
      setSaving(false)
    }
  }

  if (loadError) {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-500/5 p-8 text-center text-sm text-rose-600 dark:border-rose-700/50 dark:text-rose-400">
        {loadError}
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          <i className="bx bx-plus text-violet-400" />
          Nueva visita de servicio
        </h1>
        <p className="mt-1 text-sm text-slate-500">Registra las lecturas tomadas en campo para este componente.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Equipo</label>
            <select
              required
              value={form.equipment_id}
              onChange={(e) => setForm({ ...form, equipment_id: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">Seleccionar...</option>
              {equipos.map((e) => (
                <option key={e.id} value={e.id}>{e.code} — {e.client}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Tecnico</label>
            <select
              required
              value={form.technician_id}
              onChange={(e) => setForm({ ...form, technician_id: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">Seleccionar...</option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Componente</label>
            <select
              required
              value={form.component_id}
              onChange={(e) => setForm({ ...form, component_id: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">Seleccionar...</option>
              {componentes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Tipo de visita</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="preventivo">Preventivo</option>
              <option value="correctivo">Correctivo</option>
              <option value="instalacion">Instalacion</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Fecha y hora</label>
            <input
              required
              type="datetime-local"
              value={form.visited_at}
              onChange={(e) => setForm({ ...form, visited_at: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Lecturas de campo</p>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Presion (PSI)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.pump_pressure_psi}
                onChange={(e) => setForm({ ...form, pump_pressure_psi: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Volumen (L)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.dispensed_volume_liters}
                onChange={(e) => setForm({ ...form, dispensed_volume_liters: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Ciclo (min)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.cycle_time_minutes}
                onChange={(e) => setForm({ ...form, cycle_time_minutes: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Horas de uso</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.operating_hours}
                onChange={(e) => setForm({ ...form, operating_hours: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {selectedComponent && deviation !== null && (
          <div
            className={`rounded-lg border px-3 py-2.5 text-sm ${
              deviation >= ANOMALY_THRESHOLD_PERCENT
                ? 'border-rose-300 bg-rose-500/5 text-rose-700 dark:border-rose-700/50 dark:text-rose-400'
                : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400'
            }`}
          >
            <i className="bx bx-line-chart mr-1.5" />
            Desviacion estimada respecto a lo esperado para {selectedComponent.name}: <strong>{deviation.toFixed(1)}%</strong>
            {deviation >= ANOMALY_THRESHOLD_PERCENT && ' — se generara una anomalia automaticamente.'}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Repuestos usados (opcional)</label>
          <input
            value={form.parts_used}
            onChange={(e) => setForm({ ...form, parts_used: e.target.value })}
            placeholder="Sellos, filtro..."
            className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Notas (opcional)</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => navigate('/visitas')}
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
            {saving ? 'Guardando...' : 'Registrar visita'}
          </button>
        </div>
      </form>
    </div>
  )
}
