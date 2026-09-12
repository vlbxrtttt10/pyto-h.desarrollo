import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { equipmentAnomaliesApi } from '../../api/resources'
import Loader from '../../components/Loader'
import { CauseBadge, SeverityBadge } from '../../components/Badge'

const CAUSE_OPTIONS = [
  { value: '', label: 'Todas las causas' },
  { value: 'overheating', label: 'Sobrecalentamiento' },
  { value: 'overpressure', label: 'Sobrepresion' },
  { value: 'low_grease_level', label: 'Bajo nivel de grasa' },
]

export default function Anomalias() {
  const [anomalies, setAnomalies] = useState(null)
  const [cause, setCause] = useState('')
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    setAnomalies(null)
    setLoadError(null)
    equipmentAnomaliesApi
      .list({ cause: cause || undefined })
      .then((res) => setAnomalies(res.data))
      .catch((err) => setLoadError(err.response?.data?.message || 'No se pudieron cargar las anomalias.'))
  }, [cause])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            <i className="bx bx-error-alt text-violet-400" />
            Anomalias de equipo
          </h1>
          <p className="mt-1 text-sm text-slate-500">Fallas detectadas automaticamente en las lecturas de sensores.</p>
        </div>

        <select
          value={cause}
          onChange={(e) => setCause(e.target.value)}
          className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          {CAUSE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-500/5 p-8 text-center text-sm text-rose-600 dark:border-rose-700/50 dark:text-rose-400">
          {loadError}
        </p>
      ) : !anomalies ? (
        <Loader />
      ) : anomalies.data.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
          No se encontraron anomalias con este filtro.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {anomalies.data.map((anomaly) => (
            <div key={anomaly.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center justify-between">
                <Link
                  to="/equipos"
                  className="text-sm font-semibold text-slate-800 hover:text-violet-600 dark:text-slate-200 dark:hover:text-violet-400"
                >
                  {anomaly.sensor_reading?.equipment?.code}
                </Link>
                <div className="flex items-center gap-1.5">
                  <CauseBadge cause={anomaly.cause} />
                  <SeverityBadge severity={anomaly.severity} />
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {anomaly.sensor_reading?.component?.name} ·{' '}
                {new Date(anomaly.sensor_reading?.read_at).toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{anomaly.explanation}</p>
              <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                Downtime estimado evitado: {anomaly.estimated_downtime_hours} h
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
