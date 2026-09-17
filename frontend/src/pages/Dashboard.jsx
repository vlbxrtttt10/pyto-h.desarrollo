import { useEffect, useRef, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { dashboardApi } from '../api/resources'
import StatCard from '../components/StatCard'
import Loader from '../components/Loader'
import { CAUSE_LABELS } from '../components/Badge'
import echo from '../lib/echo'

const CAUSE_COLORS = {
  overheating: '#f43f5e',
  overpressure: '#fb7185',
  low_grease_level: '#f59e0b',
  unknown: '#64748b',
}

const CRITICALITY_LABELS = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
}

const STATUS_LABELS = {
  operativo: 'Operativo',
  en_falla: 'En falla',
  paro_emergencia: 'Paro de emergencia',
  en_mantenimiento: 'En mantenimiento',
}

const STATUS_STYLES = {
  operativo: 'bg-brand-500/15 text-brand-700 dark:text-brand-400',
  en_falla: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
  paro_emergencia: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  en_mantenimiento: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [fleet, setFleet] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [live, setLive] = useState(false)
  const [pulse, setPulse] = useState(false)
  const pulseTimeout = useRef(null)

  function load() {
    return Promise.all([dashboardApi.summary(), dashboardApi.fleetOverview()])
      .then(([summaryRes, fleetRes]) => {
        setSummary(summaryRes.data)
        setFleet(fleetRes.data)
        setLoadError(null)
      })
      .catch((err) => setLoadError(err.response?.data?.message || 'No se pudieron cargar los indicadores.'))
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const channel = echo.channel('dashboard')

    channel.subscribed(() => setLive(true))
    channel.error(() => setLive(false))

    channel.listen('.dashboard.updated', () => {
      load()
      setPulse(true)
      clearTimeout(pulseTimeout.current)
      pulseTimeout.current = setTimeout(() => setPulse(false), 1200)
    })

    return () => {
      clearTimeout(pulseTimeout.current)
      echo.leave('dashboard')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const totalEquipos = fleet.length
  const equiposEnFalla = fleet.filter((e) => e.status === 'en_falla').length
  const equiposParoEmergencia = fleet.filter((e) => e.status === 'paro_emergencia').length
  const equiposEnMantenimiento = fleet.filter((e) => e.status === 'en_mantenimiento').length
  const equiposOperativos = fleet.filter((e) => e.status === 'operativo').length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            <i className="bx bx-grid-alt text-violet-400" />
            Panel de mantenimiento predictivo
          </h1>
          <p className="mt-1 text-sm text-slate-500">Monitoreo en tiempo real de sensores instalados en la flota de Hydromaq.</p>
        </div>

        <div
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            live
              ? 'border-brand-300 bg-brand-500/10 text-brand-700 dark:border-brand-700/50 dark:text-brand-400'
              : 'border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          <span className={`relative flex h-2 w-2 ${pulse ? 'scale-125' : ''} transition-transform`}>
            <span className={`absolute inline-flex h-full w-full rounded-full ${live ? 'animate-ping bg-brand-500' : 'bg-slate-400'} opacity-75`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${live ? 'bg-brand-500' : 'bg-slate-400'}`} />
          </span>
          {live ? 'En vivo' : 'Conectando...'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Lecturas recibidas"
          value={summary.total_readings}
          hint="Enviadas por el controlador de sensores"
          icon="bx-broadcast"
        />
        <StatCard
          label="Anomalias detectadas"
          value={summary.total_anomalies}
          tone={summary.total_anomalies > 0 ? 'warn' : 'default'}
          icon="bx-error-alt"
        />
        <StatCard
          label="Horas de downtime evitadas"
          value={summary.total_downtime_hours_avoided}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Equipos totales"
          value={totalEquipos}
          hint="Registrados en la flota"
          icon="bx-car"
        />
        <StatCard
          label="Equipos en falla"
          value={equiposEnFalla}
          tone={equiposEnFalla > 0 ? 'bad' : 'good'}
          icon="bx-error"
        />
        <StatCard
          label="Paro de emergencia"
          value={equiposParoEmergencia}
          tone={equiposParoEmergencia > 0 ? 'warn' : 'good'}
          icon="bx-stop-circle"
        />
        <StatCard
          label="En mantenimiento"
          value={equiposEnMantenimiento}
          tone={equiposEnMantenimiento > 0 ? 'warn' : 'default'}
          icon="bx-wrench"
        />
        <StatCard
          label="Equipos operativos"
          value={equiposOperativos}
          tone="good"
          icon="bx-check-shield"
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
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Lecturas</th>
                <th className="px-4 py-3">Ultima lectura</th>
                <th className="px-4 py-3">Alertas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {fleet.map((equipment) => (
                <tr key={equipment.id}>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{equipment.code}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{equipment.client}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{CRITICALITY_LABELS[equipment.criticality]}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[equipment.status] || ''}`}>
                      {STATUS_LABELS[equipment.status] || equipment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{equipment.readings_count}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {equipment.last_reading_at ? new Date(equipment.last_reading_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={equipment.open_alerts > 0 ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}>
                      {equipment.open_alerts}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
