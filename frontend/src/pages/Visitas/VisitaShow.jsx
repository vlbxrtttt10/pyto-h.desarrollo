import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { serviceVisitsApi } from '../../api/resources'
import Loader from '../../components/Loader'
import { CauseBadge, SeverityBadge } from '../../components/Badge'

const TYPE_LABELS = { preventivo: 'Preventivo', correctivo: 'Correctivo', instalacion: 'Instalacion' }

export default function VisitaShow() {
  const { id } = useParams()
  const [visit, setVisit] = useState(null)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    serviceVisitsApi
      .show(id)
      .then((res) => setVisit(res.data))
      .catch((err) => setLoadError(err.response?.data?.message || 'No se pudo cargar la visita.'))
  }, [id])

  if (loadError) {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-500/5 p-8 text-center text-sm text-rose-600 dark:border-rose-700/50 dark:text-rose-400">
        {loadError}
      </p>
    )
  }

  if (!visit) return <Loader />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            <i className="bx bx-trip text-violet-400" />
            Visita — {new Date(visit.visited_at).toLocaleString()}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {visit.equipment?.code} · {visit.technician?.name} · {TYPE_LABELS[visit.type]}
          </p>
        </div>
        <Link
          to="/visitas"
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <i className="bx bx-arrow-back text-base" />
          Volver
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-900/60">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Presion</p>
          <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{visit.pump_pressure_psi} PSI</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Volumen</p>
          <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{visit.dispensed_volume_liters} L</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Ciclo</p>
          <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{visit.cycle_time_minutes} min</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Desviacion</p>
          <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{visit.deviation_percent}%</p>
        </div>
      </div>

      {visit.equipment_anomalies?.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Anomalias detectadas</p>
          {visit.equipment_anomalies.map((anomaly) => (
            <div key={anomaly.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <CauseBadge cause={anomaly.cause} />
                <SeverityBadge severity={anomaly.severity} />
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{anomaly.explanation}</p>
              <p className="mt-1 text-xs text-slate-500">Downtime estimado evitado: {anomaly.estimated_downtime_hours} h</p>
            </div>
          ))}
        </div>
      )}

      {(visit.notes || visit.parts_used) && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
          {visit.parts_used && (
            <p className="text-sm text-slate-700 dark:text-slate-300"><strong>Repuestos usados:</strong> {visit.parts_used}</p>
          )}
          {visit.notes && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{visit.notes}</p>}
        </div>
      )}
    </div>
  )
}
