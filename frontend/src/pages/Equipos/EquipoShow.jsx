import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { equipmentsApi } from '../../api/resources'
import Loader from '../../components/Loader'
import { CauseBadge, SeverityBadge } from '../../components/Badge'

const STATUS_LABELS = {
  operativo: 'Operativo',
  en_falla: 'En falla',
  en_mantenimiento: 'En mantenimiento',
}

const RISK_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Critica' }

export default function EquipoShow() {
  const { id } = useParams()
  const [equipo, setEquipo] = useState(null)
  const [loadError, setLoadError] = useState(null)

  function load() {
    setLoadError(null)
    equipmentsApi
      .show(id)
      .then((res) => setEquipo(res.data))
      .catch((err) => setLoadError(err.response?.data?.message || 'No se pudo cargar el equipo.'))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loadError) {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-500/5 p-8 text-center text-sm text-rose-600 dark:border-rose-700/50 dark:text-rose-400">
        {loadError}
      </p>
    )
  }

  if (!equipo) return <Loader />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            <i className="bx bx-wrench text-violet-400" />
            {equipo.code}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{equipo.model} · {equipo.client}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/equipos"
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <i className="bx bx-arrow-back text-base" />
            Volver
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-900/60">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Tipo</p>
          <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{equipo.type}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Sitio</p>
          <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{equipo.site || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Criticidad</p>
          <p className="mt-1 text-sm capitalize text-slate-800 dark:text-slate-200">{equipo.criticality}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Estado</p>
          <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{STATUS_LABELS[equipo.status]}</p>
        </div>
      </div>

      {equipo.maintenance_alerts?.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Alertas de mantenimiento</p>
          {equipo.maintenance_alerts.map((alert) => (
            <div key={alert.id} className="rounded-lg border border-rose-200 bg-rose-500/5 p-4 dark:border-rose-700/50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{alert.title}</p>
                <span className="text-xs font-semibold uppercase text-rose-600 dark:text-rose-400">{RISK_LABELS[alert.risk_level]}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{alert.description}</p>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
        <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Historial de visitas de servicio</p>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Tecnico</th>
              <th className="px-4 py-3">Componente</th>
              <th className="px-4 py-3">Desviacion</th>
              <th className="px-4 py-3">Anomalia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {equipo.service_visits?.map((visit) => (
              <tr key={visit.id}>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{new Date(visit.visited_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-400">{visit.type}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{visit.technician?.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{visit.component?.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{visit.deviation_percent}%</td>
                <td className="px-4 py-3">
                  {visit.equipment_anomalies?.[0] ? (
                    <div className="flex items-center gap-1.5">
                      <CauseBadge cause={visit.equipment_anomalies[0].cause} />
                      <SeverityBadge severity={visit.equipment_anomalies[0].severity} />
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
