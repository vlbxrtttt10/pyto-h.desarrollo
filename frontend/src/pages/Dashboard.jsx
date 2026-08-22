import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { dashboardApi } from '../api/resources'
import StatCard from '../components/StatCard'
import Loader from '../components/Loader'
import { CAUSE_LABELS } from '../components/Badge'

const CAUSE_COLORS = {
  excessive_idling: '#f59e0b',
  harsh_driving: '#fb7185',
  wrong_gear_usage: '#a78bfa',
  possible_mechanical_fault: '#f43f5e',
  unknown: '#64748b',
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [fleet, setFleet] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([dashboardApi.summary(), dashboardApi.fleetOverview()])
      .then(([summaryRes, fleetRes]) => {
        setSummary(summaryRes.data)
        setFleet(fleetRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader label="Cargando indicadores..." />
  if (!summary) return null

  const pieData = Object.entries(summary.cause_breakdown || {}).map(([cause, data]) => ({
    name: CAUSE_LABELS[cause] || cause,
    value: data.extra_liters,
    cause,
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          <i className="bx bx-grid-alt text-violet-400" />
          Dashboard de eficiencia
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Visibilidad en tiempo real del consumo de combustible de la flota de acarreo.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Viajes analizados" value={summary.total_trips} icon="bx-trip" />
        <StatCard
          label="Desviacion promedio"
          value={`${summary.avg_deviation_percent}%`}
          tone={summary.avg_deviation_percent > 10 ? 'bad' : 'good'}
          icon="bx-line-chart"
        />
        <StatCard
          label="Litros extra quemados"
          value={`${summary.total_extra_liters.toLocaleString('es-PE')} L`}
          tone="warn"
          icon="bx-droplet"
        />
        <StatCard
          label="Costo extra estimado"
          value={`S/ ${summary.total_extra_cost.toLocaleString('es-PE')}`}
          tone="bad"
          icon="bx-dollar-circle"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60 lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
            Litros extra por causa de anomalia
          </h2>
          {pieData.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">Sin anomalias registradas.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}>
                  {pieData.map((entry) => (
                    <Cell key={entry.cause} fill={CAUSE_COLORS[entry.cause] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                  formatter={(value) => [`${value.toFixed(1)} L`, 'Litros extra']}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Estado de la flota</h2>
            <span className="text-xs text-slate-500">{fleet.length} camiones</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2">Camion</th>
                  <th className="pb-2">Modelo</th>
                  <th className="pb-2">Viajes</th>
                  <th className="pb-2">Ultima desviacion</th>
                  <th className="pb-2">Alertas abiertas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {fleet.map((truck) => (
                  <tr key={truck.id}>
                    <td className="py-2 font-medium text-slate-800 dark:text-slate-200">{truck.code}</td>
                    <td className="py-2 text-slate-600 dark:text-slate-400">{truck.model}</td>
                    <td className="py-2 text-slate-600 dark:text-slate-400">{truck.trips_count}</td>
                    <td className="py-2">
                      <span
                        className={
                          truck.last_deviation_percent > 15
                            ? 'text-rose-600 dark:text-rose-400'
                            : truck.last_deviation_percent > 0
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-brand-600 dark:text-brand-400'
                        }
                      >
                        {truck.last_deviation_percent != null
                          ? `${Number(truck.last_deviation_percent).toFixed(1)}%`
                          : '—'}
                      </span>
                    </td>
                    <td className="py-2">
                      {truck.open_alerts > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                          <i className="bx bx-error text-sm" />
                          {truck.open_alerts} activa(s)
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">Sin alertas</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
