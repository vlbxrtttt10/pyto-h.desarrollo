import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { dashboardApi } from '../api/resources'
import StatCard from '../components/StatCard'
import Loader from '../components/Loader'
import { CAUSE_LABELS } from '../components/Badge'

const CAUSE_COLORS = {
  pressure_drop: '#fb7185',
  volume_mismatch: '#f59e0b',
  cycle_time_increase: '#a78bfa',
  possible_leak: '#f43f5e',
  unknown: '#64748b',
}

const CRITICALITY_LABELS = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [fleet, setFleet] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    Promise.all([dashboardApi.summary(), dashboardApi.fleetOverview()])
      .then(([summaryRes, fleetRes]) => {
        setSummary(summaryRes.data)
        setFleet(fleetRes.data)
      })
      .catch((err) => setLoadError(err.response?.data?.message || 'No se pudieron cargar los indicadores.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader label="Cargando indicadores..." />

  if (loadError) {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-500/5 p-8 text-center text-sm text-rose-600 dark:border-rose-700/50 dark:text-rose-400">
        {loadError}
      </p>
    )
  }

  if (!summary) return null

  const pieData = Object.entries(summary.cause_breakdown || {}).map(([cause, data]) => ({
    name: CAUSE_LABELS[cause] || cause,
    value: data.estimated_downtime_hours,
    cause,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          <i className="bx bx-grid-alt text-violet-400" />
          Panel de mantenimiento predictivo
        </h1>
        <p className="mt-1 text-sm text-slate-500">Estado de salud de los equipos de lubricacion e hidraulica en campo.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Visitas analizadas"
          value={summary.total_visits}
          hint={`${summary.preventive_visits} preventivas · ${summary.corrective_visits} correctivas`}
          icon="bx-trip"
        />
        <StatCard
          label="Desviacion promedio"
          value={`${summary.avg_deviation_percent}%`}
          tone={summary.avg_deviation_percent > 10 ? 'bad' : 'default'}
          icon="bx-line-chart"
        />
        <StatCard
          label="Horas de downtime evitadas"
          value={summary.total_downtime_hours_avoided}
          hint={`${summary.total_anomalies} anomalias detectadas`}
          tone="warn"
          icon="bx-time-five"
        />
        <StatCard
          label="Alertas abiertas"
          value={summary.open_maintenance_alerts}
          tone={summary.open_maintenance_alerts > 0 ? 'bad' : 'good'}
          icon="bx-bell"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-1 dark:border-slate-800 dark:bg-slate-900/60">
          <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Horas de downtime evitadas por causa</p>
          {pieData.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">Sin anomalias registradas todavia.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {pieData.map((entry) => (
                    <Cell key={entry.cause} fill={CAUSE_COLORS[entry.cause] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--color-slate-900, #0f172a)', border: 'none', borderRadius: 8, color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white lg:col-span-2 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Estado de la flota</p>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                <th className="px-4 py-3">Codigo</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Criticidad</th>
                <th className="px-4 py-3">Visitas</th>
                <th className="px-4 py-3">Ultima desviacion</th>
                <th className="px-4 py-3">Alertas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {fleet.map((equipment) => (
                <tr key={equipment.id}>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{equipment.code}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{equipment.client}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{CRITICALITY_LABELS[equipment.criticality]}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{equipment.visits_count}</td>
                  <td className="px-4 py-3">
                    {equipment.last_deviation_percent == null ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <span
                        className={
                          Number(equipment.last_deviation_percent) > 15
                            ? 'text-rose-600 dark:text-rose-400'
                            : Number(equipment.last_deviation_percent) > 0
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-brand-600 dark:text-brand-400'
                        }
                      >
                        {Number(equipment.last_deviation_percent).toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{equipment.open_alerts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
