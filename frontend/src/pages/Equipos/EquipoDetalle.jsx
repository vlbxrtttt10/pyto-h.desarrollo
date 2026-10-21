import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { equipmentsApi } from '../../api/resources'
import Loader from '../../components/Loader'
import { CauseBadge, SeverityBadge } from '../../components/Badge'

const CRITICALITY_LABELS = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
}

const STATUS_LABELS = {
  operativo: 'Operativo',
  en_falla: 'En falla',
  paro_emergencia: 'Paro de emergencia',
  en_mantenimiento: 'En mantenimiento',
}

const STATUS_STYLES = {
  operativo: 'bg-brand-500/15 text-brand-700 dark:text-brand-400',
  en_falla: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
  paro_emergencia: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  en_mantenimiento: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
}

const ALERT_STATUS_LABELS = {
  open: 'Abierta',
  acknowledged: 'Reconocida',
  resolved: 'Resuelta',
}

const RISK_LABELS = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
}

export default function EquipoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [equipment, setEquipment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    setLoading(true)
    equipmentsApi
      .show(id)
      .then((res) => {
        setEquipment(res.data)
        setLoadError(null)
      })
      .catch((err) =>
        setLoadError(
          err.response?.data?.message || 'No se pudo cargar el equipo.'
        )
      )
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Loader label="Cargando equipo..." />

  if (loadError) {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-500/5 p-8 text-center text-sm text-rose-600 dark:border-rose-700/50 dark:text-rose-400">
        {loadError}
      </p>
    )
  }

  if (!equipment) return null

  const readings = equipment.sensor_readings || []
  const alerts = equipment.maintenance_alerts || []
  const components = equipment.equipment_components || []
  const anomalies = readings.flatMap((reading) =>
    (reading.equipment_anomalies || []).map((anomaly) => ({
      ...anomaly,
      read_at: reading.read_at,
    }))
  )

  return (
    <div className="space-y-7">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/equipos')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <i className="bx bx-arrow-back text-lg" />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <i className="bx bx-car text-xl text-violet-400" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {equipment.code}
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {equipment.model} · {equipment.client}
              </p>
            </div>
          </div>
        </div>

        <span
          className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-medium ${
            STATUS_STYLES[equipment.status] || ''
          }`}
        >
          {STATUS_LABELS[equipment.status] || equipment.status}
        </span>
      </div>

      {/* Datos generales */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <i className="bx bx-info-circle text-lg text-slate-400" />
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Datos generales
            </h2>
            <p className="text-xs text-slate-500">
              Información de registro del equipo
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-800 dark:bg-slate-900/60">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Cliente
            </p>
            <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
              {equipment.client}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sitio
            </p>
            <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
              {equipment.site || '—'}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Criticidad
            </p>
            <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
              {CRITICALITY_LABELS[equipment.criticality] || equipment.criticality}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Fecha de instalación
            </p>
            <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
              {equipment.install_date
                ? new Date(equipment.install_date).toLocaleDateString()
                : '—'}
            </p>
          </div>
        </div>
      </section>

      {/* Componentes */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <i className="bx bx-chip text-lg text-slate-400" />
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Componentes instalados
            </h2>
            <p className="text-xs text-slate-500">
              {components.length} componente{components.length !== 1 ? 's' : ''} registrado{components.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          {components.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              Sin componentes registrados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
                    <th className="whitespace-nowrap px-4 py-3">Componente</th>
                    <th className="whitespace-nowrap px-4 py-3">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {components.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {item.component?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {item.component?.type || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Anomalías */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <i className="bx bx-error-alt text-lg text-slate-400" />
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Anomalías detectadas
            </h2>
            <p className="text-xs text-slate-500">
              {anomalies.length} anomalía{anomalies.length !== 1 ? 's' : ''} registrada{anomalies.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          {anomalies.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              Sin anomalías registradas para este equipo.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
                    <th className="whitespace-nowrap px-4 py-3">Fecha</th>
                    <th className="whitespace-nowrap px-4 py-3">Causa</th>
                    <th className="whitespace-nowrap px-4 py-3">Severidad</th>
                    <th className="whitespace-nowrap px-4 py-3">Downtime evitado (h)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {anomalies.map((anomaly) => (
                    <tr key={anomaly.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-400">
                        {anomaly.read_at
                          ? new Date(anomaly.read_at).toLocaleString()
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <CauseBadge cause={anomaly.cause} />
                      </td>
                      <td className="px-4 py-3">
                        <SeverityBadge severity={anomaly.severity} />
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {anomaly.estimated_downtime_hours ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Alertas de mantenimiento */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <i className="bx bx-bell text-lg text-slate-400" />
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Alertas de mantenimiento
            </h2>
            <p className="text-xs text-slate-500">
              {alerts.length} alerta{alerts.length !== 1 ? 's' : ''} registrada{alerts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          {alerts.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              Sin alertas de mantenimiento para este equipo.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
                    <th className="whitespace-nowrap px-4 py-3">Título</th>
                    <th className="whitespace-nowrap px-4 py-3">Riesgo</th>
                    <th className="whitespace-nowrap px-4 py-3">Estado</th>
                    <th className="whitespace-nowrap px-4 py-3">Creada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {alerts.map((alert) => (
                    <tr key={alert.id}>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        <p className="font-medium">{alert.title}</p>
                        {alert.description && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {alert.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {RISK_LABELS[alert.risk_level] || alert.risk_level}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {ALERT_STATUS_LABELS[alert.status] || alert.status}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-400">
                        {alert.created_at
                          ? new Date(alert.created_at).toLocaleString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Últimas lecturas de sensores */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <i className="bx bx-broadcast text-lg text-slate-400" />
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Últimas lecturas de sensores
            </h2>
            <p className="text-xs text-slate-500">
              {readings.length} lectura{readings.length !== 1 ? 's' : ''} registrada{readings.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          {readings.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              Sin lecturas registradas para este equipo.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/30">
                    <th className="whitespace-nowrap px-4 py-3">Fecha</th>
                    <th className="whitespace-nowrap px-4 py-3">Componente</th>
                    <th className="whitespace-nowrap px-4 py-3">Temperatura</th>
                    <th className="whitespace-nowrap px-4 py-3">Presión</th>
                    <th className="whitespace-nowrap px-4 py-3">Nivel de grasa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {readings.slice(0, 20).map((reading) => (
                    <tr key={reading.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-400">
                        {reading.read_at
                          ? new Date(reading.read_at).toLocaleString()
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {reading.equipment_component?.component?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {reading.temperature_celsius != null
                          ? `${reading.temperature_celsius}°C`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {reading.pressure_psi != null
                          ? `${reading.pressure_psi} PSI`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {reading.grease_level_percent != null
                          ? `${reading.grease_level_percent}%`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
