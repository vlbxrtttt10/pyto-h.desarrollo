import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { techniciansApi } from '../../api/resources'
import Loader from '../../components/Loader'

export default function TecnicoShow() {
  const { id } = useParams()
  const [tecnico, setTecnico] = useState(null)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    setLoadError(null)
    techniciansApi
      .show(id)
      .then((res) => setTecnico(res.data))
      .catch((err) => setLoadError(err.response?.data?.message || 'No se pudo cargar el tecnico.'))
  }, [id])

  if (loadError) {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-500/5 p-8 text-center text-sm text-rose-600 dark:border-rose-700/50 dark:text-rose-400">
        {loadError}
      </p>
    )
  }

  if (!tecnico) return <Loader />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            <i className="bx bx-id-card text-violet-400" />
            {tecnico.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{tecnico.employee_code} · {tecnico.specialty || 'Sin especialidad'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/tecnicos"
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <i className="bx bx-arrow-back text-base" />
            Volver
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
        <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ultimas visitas realizadas</p>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Equipo</th>
              <th className="px-4 py-3">Componente</th>
              <th className="px-4 py-3">Desviacion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {tecnico.service_visits?.map((visit) => (
              <tr key={visit.id}>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{new Date(visit.visited_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{visit.equipment?.code}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{visit.component?.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{visit.deviation_percent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
