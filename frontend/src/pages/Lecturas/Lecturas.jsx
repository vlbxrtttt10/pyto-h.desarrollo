import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { sensorReadingsApi, equipmentsApi, componentsApi } from '../../api/resources'
import Loader from '../../components/Loader'
import Modal from '../../components/Modal'
import { CauseBadge, SeverityBadge } from '../../components/Badge'
import Notify, { Confirm } from '../../lib/notify'

const FAILURE_OPTIONS = [
  { value: 'normal', label: 'Normal (dentro de rango)', icon: 'bx-check-circle', tone: 'good' },
  { value: 'overheating', label: 'Sobrecalentamiento', icon: 'bx-hot', tone: 'bad' },
  { value: 'overpressure', label: 'Sobrepresion', icon: 'bx-tachometer', tone: 'bad' },
  { value: 'low_grease_level', label: 'Bajo nivel de grasa', icon: 'bx-droplet', tone: 'bad' },
]

function randomBetween(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100
}

/** Genera los valores de una lectura simulada segun el escenario elegido, a partir de los rangos normales del componente. */
function buildSimulatedValues(component, scenario) {
  const normalTemperature = randomBetween(Number(component.min_temperature_celsius), Number(component.max_temperature_celsius))
  const normalPressure = randomBetween(Number(component.min_pressure_psi), Number(component.max_pressure_psi))
  const normalGrease = randomBetween(Number(component.min_grease_level_percent) + 10, 95)

  const values = {
    temperature_celsius: normalTemperature,
    pressure_psi: normalPressure,
    grease_level_percent: normalGrease,
  }

  if (scenario === 'overheating') {
    values.temperature_celsius = Math.round(Number(component.max_temperature_celsius) * randomBetween(1.15, 1.4) * 100) / 100
  } else if (scenario === 'overpressure') {
    values.pressure_psi = Math.round(Number(component.max_pressure_psi) * randomBetween(1.1, 1.3) * 100) / 100
  } else if (scenario === 'low_grease_level') {
    values.grease_level_percent = Math.round(Number(component.min_grease_level_percent) * randomBetween(0.3, 0.7) * 100) / 100
  }

  return values
}

export default function Lecturas() {
  const [readings, setReadings] = useState(null)
  const [page, setPage] = useState(1)
  const [loadError, setLoadError] = useState(null)

  const [equipos, setEquipos] = useState([])
  const [componentes, setComponentes] = useState([])

  const [simEquipmentId, setSimEquipmentId] = useState('')
  const [simComponentId, setSimComponentId] = useState('')
  const [simScenario, setSimScenario] = useState('normal')
  const [simulating, setSimulating] = useState(false)
  const [simResult, setSimResult] = useState(null)

  const [manualModalOpen, setManualModalOpen] = useState(false)
  const [form, setForm] = useState({
    equipment_id: '', component_id: '', temperature_celsius: '', pressure_psi: '', grease_level_percent: '', read_at: '',
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  function load() {
    setReadings(null)
    setLoadError(null)
    sensorReadingsApi
      .list({ page })
      .then((res) => setReadings(res.data))
      .catch((err) => setLoadError(err.response?.data?.message || 'No se pudieron cargar las lecturas.'))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  useEffect(() => {
    Promise.all([equipmentsApi.list(), componentsApi.list()])
      .then(([equiposRes, componentesRes]) => {
        setEquipos(equiposRes.data)
        setComponentes(componentesRes.data)
        if (equiposRes.data[0]) setSimEquipmentId(String(equiposRes.data[0].id))
        if (componentesRes.data[0]) setSimComponentId(String(componentesRes.data[0].id))
      })
      .catch(() => {})
  }, [])

  function handleDelete(reading) {
    Confirm.show(
      'Eliminar lectura',
      '¿Estas seguro de eliminar esta lectura de sensor?',
      'Si, eliminar',
      'Cancelar',
      async () => {
        try {
          await sensorReadingsApi.remove(reading.id)
          Notify.success('Lectura eliminada')
          load()
        } catch (err) {
          Notify.failure(err.response?.data?.message || 'No se pudo eliminar la lectura.')
        }
      },
      () => {},
    )
  }

  async function handleSimulate() {
    const component = componentes.find((c) => String(c.id) === String(simComponentId))
    if (!simEquipmentId || !component) {
      Notify.failure('Selecciona un equipo y un componente para simular.')
      return
    }

    setSimulating(true)
    setSimResult(null)
    try {
      const values = buildSimulatedValues(component, simScenario)
      const payload = {
        equipment_id: simEquipmentId,
        component_id: simComponentId,
        read_at: new Date().toISOString(),
        ...values,
      }

      const res = await sensorReadingsApi.create(payload)
      const anomaly = res.data.equipment_anomalies?.[0]

      setSimResult({
        values,
        anomaly,
        equipmentCode: res.data.equipment?.code,
      })

      if (anomaly) {
        Notify.failure(`Anomalia detectada: ${anomaly.cause}`)
      } else {
        Notify.success('Lectura simulada dentro de rango normal')
      }

      if (page === 1) {
        load()
      } else {
        setPage(1)
      }
    } catch (err) {
      Notify.failure(err.response?.data?.message || 'No se pudo enviar la lectura simulada.')
    } finally {
      setSimulating(false)
    }
  }

  function openManualForm() {
    setForm({ equipment_id: '', component_id: '', temperature_celsius: '', pressure_psi: '', grease_level_percent: '', read_at: '' })
    setFormError(null)
    setManualModalOpen(true)
  }

  async function handleManualSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      await sensorReadingsApi.create(form)
      Notify.success('Lectura registrada correctamente')
      setManualModalOpen(false)
      setPage(1)
      load()
    } catch (err) {
      const message = err.response?.data?.message || 'No se pudo registrar la lectura.'
      setFormError(message)
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            <i className="bx bx-broadcast text-violet-400" />
            Lecturas de sensores
          </h1>
          <p className="mt-1 text-sm text-slate-500">Registro de temperatura, presion y nivel de grasa recibido de los PLCs instalados en campo.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openManualForm}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <i className="bx bx-plus text-base" />
            Registrar manual
          </button>
          <Link
            to="/reportes"
            className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-violet-600 dark:hover:bg-violet-700"
          >
            <i className="bx bx-sitemap text-base" />
            Ver como funciona
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-5 dark:border-violet-800/50 dark:bg-violet-500/5">
        <div className="mb-3 flex items-center gap-2">
          <i className="bx bx-chip text-lg text-violet-500" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Panel de simulacion (PLC virtual)</p>
        </div>
        <p className="mb-4 text-xs text-slate-500">
          Mientras no hay sensores fisicos conectados, uso este panel para simular la lectura que enviaria el controlador Node.js desde un equipo real.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Equipo</label>
            <select
              value={simEquipmentId}
              onChange={(e) => setSimEquipmentId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {equipos.map((eq) => (
                <option key={eq.id} value={eq.id}>{eq.code} — {eq.client}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Componente</label>
            <select
              value={simComponentId}
              onChange={(e) => setSimComponentId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {componentes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Escenario</label>
            <select
              value={simScenario}
              onChange={(e) => setSimScenario(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {FAILURE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSimulate}
          disabled={simulating || !equipos.length || !componentes.length}
          className="mt-4 flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
        >
          <i className="bx bx-broadcast text-base" />
          {simulating ? 'Enviando lectura...' : 'Simular lectura ahora'}
        </button>

        {simResult && (
          <div
            className={`mt-4 rounded-lg border px-3 py-2.5 text-sm ${
              simResult.anomaly
                ? 'border-rose-300 bg-rose-500/5 text-rose-700 dark:border-rose-700/50 dark:text-rose-400'
                : 'border-brand-300 bg-brand-500/5 text-brand-700 dark:border-brand-700/50 dark:text-brand-400'
            }`}
          >
            <p className="font-medium">
              {simResult.equipmentCode} → T={simResult.values.temperature_celsius}°C · P={simResult.values.pressure_psi} PSI · Grasa={simResult.values.grease_level_percent}%
            </p>
            {simResult.anomaly ? (
              <p className="mt-1">
                <i className="bx bx-error-alt mr-1" />
                Anomalia: {simResult.anomaly.cause} ({simResult.anomaly.severity}). Si se repite en lecturas consecutivas, se abrira una alerta y se notificara por Telegram.
              </p>
            ) : (
              <p className="mt-1">
                <i className="bx bx-check-circle mr-1" />
                Dentro de rango normal, sin anomalia.
              </p>
            )}
          </div>
        )}
      </div>

      {!readings ? (
        <Loader label="Cargando lecturas..." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Equipo</th>
                <th className="px-4 py-3">Componente</th>
                <th className="px-4 py-3">Temperatura</th>
                <th className="px-4 py-3">Presion</th>
                <th className="px-4 py-3">Grasa</th>
                <th className="px-4 py-3">Anomalia</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {readings.data.map((reading) => (
                <tr key={reading.id}>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{new Date(reading.read_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    <Link to="/equipos" className="hover:text-violet-600 dark:hover:text-violet-400">
                      {reading.equipment?.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{reading.component?.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{reading.temperature_celsius}°C</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{reading.pressure_psi} PSI</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{reading.grease_level_percent}%</td>
                  <td className="px-4 py-3">
                    {reading.equipment_anomalies?.[0] ? (
                      <div className="flex items-center gap-1.5">
                        <CauseBadge cause={reading.equipment_anomalies[0].cause} />
                        <SeverityBadge severity={reading.equipment_anomalies[0].severity} />
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(reading)}
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
      )}

      {readings && readings.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Pagina {readings.current_page} de {readings.last_page} · {readings.total} lecturas
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            >
              Anterior
            </button>
            <button
              disabled={page >= readings.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      <Modal open={manualModalOpen} onClose={() => setManualModalOpen(false)} title="Registrar lectura manual" maxWidth="max-w-2xl">
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Equipo</label>
              <select
                required
                value={form.equipment_id}
                onChange={(e) => setForm({ ...form, equipment_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Seleccionar...</option>
                {equipos.map((eq) => (
                  <option key={eq.id} value={eq.id}>{eq.code} — {eq.client}</option>
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

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Fecha y hora de la lectura</label>
            <input
              required
              type="datetime-local"
              value={form.read_at}
              onChange={(e) => setForm({ ...form, read_at: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Temperatura (°C)</label>
              <input
                required
                type="number"
                step="0.01"
                value={form.temperature_celsius}
                onChange={(e) => setForm({ ...form, temperature_celsius: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Presion (PSI)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.pressure_psi}
                onChange={(e) => setForm({ ...form, pressure_psi: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Nivel de grasa (%)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.grease_level_percent}
                onChange={(e) => setForm({ ...form, grease_level_percent: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {formError && <p className="text-sm text-rose-600 dark:text-rose-400">{formError}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setManualModalOpen(false)}
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
              {saving ? 'Guardando...' : 'Registrar lectura'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
