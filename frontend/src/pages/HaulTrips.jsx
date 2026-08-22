import { useEffect, useState } from 'react'
import { haulTripsApi } from '../api/resources'
import Loader from '../components/Loader'
import { CauseBadge, SeverityBadge } from '../components/Badge'

export default function HaulTrips() {
  const [trips, setTrips] = useState(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setTrips(null)
    haulTripsApi.list({ page }).then((res) => setTrips(res.data))
  }, [page])

  if (!trips) return <Loader label="Cargando viajes..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          <i className="bx bx-trip text-violet-400" />
          Viajes de acarreo
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Historial de viajes con el consumo real vs. el esperado por la IA.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Camion</th>
              <th className="px-4 py-3">Operador</th>
              <th className="px-4 py-3">Ruta</th>
              <th className="px-4 py-3">Real (L)</th>
              <th className="px-4 py-3">Esperado (L)</th>
              <th className="px-4 py-3">Desviacion</th>
              <th className="px-4 py-3">Anomalia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {trips.data.map((trip) => (
              <tr key={trip.id}>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {new Date(trip.started_at).toLocaleString('es-PE', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </td>
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{trip.truck?.code}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{trip.operator?.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{trip.haul_route?.name}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{Number(trip.fuel_consumed_liters).toFixed(1)}</td>
                <td className="px-4 py-3 text-slate-500">{Number(trip.expected_fuel_liters).toFixed(1)}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      trip.deviation_percent > 15
                        ? 'font-semibold text-rose-600 dark:text-rose-400'
                        : trip.deviation_percent > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-brand-600 dark:text-brand-400'
                    }
                  >
                    {Number(trip.deviation_percent).toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  {trip.fuel_anomalies?.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <CauseBadge cause={trip.fuel_anomalies[0].cause} />
                      <SeverityBadge severity={trip.fuel_anomalies[0].severity} />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600">Normal</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Pagina {trips.current_page} de {trips.last_page} · {trips.total} viajes
        </span>
        <div className="flex gap-2">
          <button
            disabled={trips.current_page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
          >
            <i className="bx bx-chevron-left text-sm" />
            Anterior
          </button>
          <button
            disabled={trips.current_page >= trips.last_page}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
          >
            Siguiente
            <i className="bx bx-chevron-right text-sm" />
          </button>
        </div>
      </div>
    </div>
  )
}
