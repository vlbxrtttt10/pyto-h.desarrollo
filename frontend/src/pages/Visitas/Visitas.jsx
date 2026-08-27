import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { serviceVisitsApi } from '../../api/resources'
import Loader from '../../components/Loader'
import { CauseBadge, SeverityBadge } from '../../components/Badge'
import Notify, { Confirm } from '../../lib/notify'

const TYPE_LABELS = { preventivo: 'Preventivo', correctivo: 'Correctivo', instalacion: 'Instalacion' }

export default function Visitas() {
  const [visits, setVisits] = useState(null)
  const [page, setPage] = useState(1)
  const [loadError, setLoadError] = useState(null)

  function load() {
    setVisits(null)
    setLoadError(null)
    serviceVisitsApi
      .list({ page })
      .then((res) => setVisits(res.data))
      .catch((err) => setLoadError(err.response?.data?.message || 'No se pudieron cargar las visitas.'))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  function handleDelete(visit) {
    Confirm.show(
      'Eliminar visita',
      '¿Estas seguro de eliminar esta visita de servicio?',
      'Si, eliminar',
      'Cancelar',
      async () => {
        try {
          await serviceVisitsApi.remove(visit.id)
          Notify.success('Visita eliminada')
          load()
        } catch (err) {
          Notify.failure(err.response?.data?.message || 'No se pudo eliminar la visita.')
        }
      },
      () => {},
    )
  }

  if (loadError) {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-500/5 p-8 text-center text-sm text-rose-600 dark:border-rose-700/50 dark:text-rose-400">
        {loadError}
      </p>
    )
  }

  if (!visits) return <Loader label="Cargando visitas..." />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            <i className="bx bx-trip text-violet-400" />
            Visitas de servicio
          </h1>
          <p className="mt-1 text-sm text-slate-500">Registro de mantenimiento preventivo, correctivo e instalaciones en campo.</p>
        </div>

        <Link
          to="/visitas/crear"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <i className="bx bx-plus text-base" />
          Nueva visita
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Equipo</th>
              <th className="px-4 py-3">Tecnico</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Desviacion</th>
              <th className="px-4 py-3">Anomalia</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {visits.data.map((visit) => (
              <tr key={visit.id}>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{new Date(visit.visited_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  <Link to={`/equipos/${visit.equipment?.id}`} className="hover:text-violet-600 dark:hover:text-violet-400">
                    {visit.equipment?.code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{visit.technician?.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{TYPE_LABELS[visit.type]}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      Number(visit.deviation_percent) > 15
                        ? 'text-rose-600 dark:text-rose-400'
                        : Number(visit.deviation_percent) > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-brand-600 dark:text-brand-400'
                    }
                  >
                    {visit.deviation_percent}%
                  </span>
                </td>
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
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(visit)}
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

      {visits.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Pagina {visits.current_page} de {visits.last_page} · {visits.total} visitas
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
              disabled={page >= visits.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
