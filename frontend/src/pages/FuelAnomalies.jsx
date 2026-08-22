import { useEffect, useState } from 'react'
import { fuelAnomaliesApi } from '../api/resources'
import Loader from '../components/Loader'
import { CauseBadge, SeverityBadge } from '../components/Badge'

const CAUSE_OPTIONS = [
  { value: '', label: 'Todas las causas' },
  { value: 'excessive_idling', label: 'Ralenti excesivo' },
  { value: 'harsh_driving', label: 'Conduccion agresiva' },
  { value: 'wrong_gear_usage', label: 'Uso incorrecto de marchas' },
  { value: 'possible_mechanical_fault', label: 'Posible falla mecanica' },
]

export default function FuelAnomalies() {
  const [anomalies, setAnomalies] = useState(null)
  const [cause, setCause] = useState('')

  useEffect(() => {
    setAnomalies(null)
    fuelAnomaliesApi.list({ cause: cause || undefined }).then((res) => setAnomalies(res.data))
  }, [cause])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            <i className="bx bx-error-alt text-violet-400" />
            Anomalias de combustible
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Desviaciones detectadas por el motor de IA, con causa raiz explicada.
          </p>
        </div>

        <select
          value={cause}
          onChange={(e) => setCause(e.target.value)}
          className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          {CAUSE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {!anomalies ? (
        <Loader label="Cargando anomalias..." />
      ) : anomalies.data.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
          No se encontraron anomalias con este filtro.
        </p>
      ) : (
        <div className="space-y-3">
          {anomalies.data.map((anomaly) => (
            <div
              key={anomaly.id}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {anomaly.haul_trip?.truck?.code}
                    </span>
                    <span className="text-sm text-slate-500">
                      · {anomaly.haul_trip?.operator?.name}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(anomaly.haul_trip?.started_at).toLocaleString('es-PE', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}{' '}
                    · {anomaly.haul_trip?.haul_route?.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CauseBadge cause={anomaly.cause} />
                  <SeverityBadge severity={anomaly.severity} />
                </div>
              </div>

              <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{anomaly.explanation}</p>

              <div className="mt-3 flex gap-6 text-sm">
                <span className="text-amber-600 dark:text-amber-400">
                  +{Number(anomaly.extra_liters).toFixed(1)} L extra
                </span>
                <span className="text-rose-600 dark:text-rose-400">
                  S/ {Number(anomaly.extra_cost).toFixed(2)} de sobrecosto
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
