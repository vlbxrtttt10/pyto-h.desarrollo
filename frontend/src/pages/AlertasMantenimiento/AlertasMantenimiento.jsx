import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { maintenanceAlertsApi } from '../../api/resources'
import Loader from '../../components/Loader'
import Notify from '../../lib/notify'

const RISK_STYLES = {
  low: 'border-slate-300 bg-slate-100/60 dark:border-slate-700 dark:bg-slate-800/40',
  medium: 'border-amber-300 bg-amber-500/5 dark:border-amber-700/50',
  high: 'border-rose-300 bg-rose-500/5 dark:border-rose-700/50',
  critical: 'border-rose-400 bg-rose-500/10 dark:border-rose-600',
}

const STATUS_LABELS = { open: 'Abierta', acknowledged: 'Reconocida', resolved: 'Resuelta' }
const RISK_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Critica' }

export default function AlertasMantenimiento() {
  const [alerts, setAlerts] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [loadError, setLoadError] = useState(null)

  function load() {
    setLoadError(null)
    maintenanceAlertsApi
      .list()
      .then((res) => setAlerts(res.data))
      .catch((err) => setLoadError(err.response?.data?.message || 'No se pudieron cargar las alertas.'))
  }

  useEffect(() => {
    load()
  }, [])

  async function updateStatus(id, status) {
    setUpdatingId(id)
    try {
      await maintenanceAlertsApi.update(id, { status })
      Notify.success('Estado actualizado')
      load()
    } catch (err) {
      Notify.failure(err.response?.data?.message || 'No se pudo actualizar la alerta.')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loadError) {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-500/5 p-8 text-center text-sm text-rose-600 dark:border-rose-700/50 dark:text-rose-400">
        {loadError}
      </p>
    )
  }

  if (!alerts) return <Loader label="Cargando alertas..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          <i className="bx bx-bell text-violet-400" />
          Alertas de mantenimiento
        </h1>
        <p className="mt-1 text-sm text-slate-500">Equipos con riesgo de falla detectado a partir de visitas consecutivas.</p>
      </div>

      {alerts.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
          No hay alertas de mantenimiento activas en este momento.
        </p>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className={`rounded-xl border p-4 ${RISK_STYLES[alert.risk_level]}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/equipos/${alert.equipment?.id}`}
                      className="text-sm font-semibold text-slate-800 hover:text-violet-600 dark:text-slate-200 dark:hover:text-violet-400"
                    >
                      {alert.equipment?.code}
                    </Link>
                    <span className="text-xs text-slate-500">{alert.equipment?.model}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">{alert.title}</p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold uppercase text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  Riesgo {RISK_LABELS[alert.risk_level]}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{alert.description}</p>
              {alert.recommended_action && (
                <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <i className="bx bx-bulb mr-1" />
                  {alert.recommended_action}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase text-slate-500">{STATUS_LABELS[alert.status]}</span>
                <div className="flex gap-2">
                  {alert.status !== 'acknowledged' && alert.status !== 'resolved' && (
                    <button
                      disabled={updatingId === alert.id}
                      onClick={() => updateStatus(alert.id, 'acknowledged')}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Reconocer
                    </button>
                  )}
                  {alert.status !== 'resolved' && (
                    <button
                      disabled={updatingId === alert.id}
                      onClick={() => updateStatus(alert.id, 'resolved')}
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      Marcar resuelta
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
