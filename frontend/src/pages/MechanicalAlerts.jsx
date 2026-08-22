import { useEffect, useState } from 'react'
import { mechanicalAlertsApi } from '../api/resources'
import Loader from '../components/Loader'

const RISK_STYLES = {
  low: 'border-slate-300 bg-slate-100/60 dark:border-slate-700 dark:bg-slate-800/40',
  medium: 'border-amber-300 bg-amber-500/5 dark:border-amber-700/50',
  high: 'border-rose-300 bg-rose-500/5 dark:border-rose-700/50',
  critical: 'border-rose-400 bg-rose-500/10 dark:border-rose-600',
}

const STATUS_LABELS = {
  open: 'Abierta',
  acknowledged: 'Reconocida',
  resolved: 'Resuelta',
}

export default function MechanicalAlerts() {
  const [alerts, setAlerts] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  function load() {
    mechanicalAlertsApi.list().then((res) => setAlerts(res.data))
  }

  useEffect(() => {
    load()
  }, [])

  async function updateStatus(id, status) {
    setUpdatingId(id)
    try {
      await mechanicalAlertsApi.update(id, { status })
      load()
    } finally {
      setUpdatingId(null)
    }
  }

  if (!alerts) return <Loader label="Cargando alertas..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          <i className="bx bx-wrench text-violet-400" />
          Alertas de posible falla mecanica
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Camiones con sobreconsumo sostenido que no se explica por habitos de conduccion.
        </p>
      </div>

      {alerts.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
          No hay alertas mecanicas activas. La flota opera dentro de parametros normales.
        </p>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl border p-5 ${RISK_STYLES[alert.risk_level] || RISK_STYLES.low}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{alert.truck?.code}</span>
                    <span className="text-sm text-slate-500">{alert.truck?.model}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">{alert.title}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Riesgo {alert.risk_level}
                </span>
              </div>

              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{alert.description}</p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  Estado: <span className="font-medium text-slate-700 dark:text-slate-300">{STATUS_LABELS[alert.status]}</span>
                </span>

                <div className="flex gap-2">
                  {alert.status !== 'acknowledged' && alert.status !== 'resolved' && (
                    <button
                      disabled={updatingId === alert.id}
                      onClick={() => updateStatus(alert.id, 'acknowledged')}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <i className="bx bx-check text-sm" />
                      Reconocer
                    </button>
                  )}
                  {alert.status !== 'resolved' && (
                    <button
                      disabled={updatingId === alert.id}
                      onClick={() => updateStatus(alert.id, 'resolved')}
                      className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      <i className="bx bx-check-double text-sm" />
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
