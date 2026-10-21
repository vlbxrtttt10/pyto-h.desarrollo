import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { reportsApi } from '../../api/resources'
import Notify from '../../lib/notify'

export default function Reportes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          <i className="bx bx-sitemap text-violet-400" />
          Reportes — Como funciona Aleri
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Flujo completo de mantenimiento predictivo: desde el sensor instalado en el equipo hasta el aviso en Telegram.
        </p>
      </div>

      <MonthlyDowntimeCard />

      <ExportAnomaliesCard />

      <FlowDiagram />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoCard
          icon="bx-chip"
          title="1. Captura"
          text="Sensores/PLC instalados en cada camion lubricador miden temperatura, presion y nivel de grasa en tiempo real."
        />
        <InfoCard
          icon="bx-server"
          title="2. Procesamiento"
          text="Un controlador (Node-RED / Node.js) lee esas senales y las envia a la API de Aleri, que las compara contra el rango normal del componente."
        />
        <InfoCard
          icon="bxl-telegram"
          title="3. Reaccion"
          text="Si hay varias lecturas fuera de rango seguidas, se abre una alerta de mantenimiento y se notifica al instante por Telegram."
        />
      </div>
    </div>
  )
}

function InfoCard({ icon, title, text }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
        <i className={`bx ${icon} text-lg`} />
      </div>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  )
}

function FlowDiagram() {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
      <svg viewBox="0 0 1180 620" className="mx-auto min-w-[820px]" role="img" aria-label="Diagrama de flujo de deteccion de fallas y notificacion">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 Z" className="fill-slate-400 dark:fill-slate-500" />
          </marker>
          <marker id="arrowAlert" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 Z" fill="#e11d48" />
          </marker>
        </defs>

        <NodeBox x={20} y={40} w={190} h={130} icon="bx-car" title="Equipo en campo" subtitle="Camion lubricador (Hydromaq)" accent="#0ea5e9" />
        <SensorDot x={175} y={55} />

        <path d="M210 105 H 300" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
        <EdgeLabel x={255} y={95} text="lee sensor" />

        <NodeBox x={300} y={40} w={190} h={130} icon="bx-desktop" title="Controlador" subtitle="Node-RED / Node.js — simulado hoy" accent="#22c55e" />

        <path d="M490 105 H 580" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
        <EdgeLabel x={535} y={95} text="POST" />

        <NodeBox x={580} y={40} w={210} h={130} icon="bx-plug" title="API Aleri" subtitle="/api/sensor-readings" accent="#8b5cf6" />

        <path d="M685 170 V 250" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
        <EdgeLabel x={735} y={215} text="guarda + evalua" />

        <NodeBox x={580} y={250} w={210} h={130} icon="bx-brain" title="Motor de deteccion" subtitle="Compara vs. rango normal" accent="#f59e0b" />

        <path d="M580 300 H 460" className="stroke-brand-500" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
        <EdgeLabel x={500} y={290} text="dentro de rango" tone="good" />
        <NodeBox x={260} y={250} w={200} h={100} icon="bx-check-circle" title="Sin novedad" subtitle="Se guarda el historial" accent="#16a34a" small />

        <path d="M685 380 V 440" stroke="#e11d48" strokeWidth="2.5" fill="none" markerEnd="url(#arrowAlert)" />
        <EdgeLabel x={735} y={415} text="fuera de rango" tone="bad" />

        <NodeBox x={580} y={440} w={210} h={110} icon="bx-error-alt" title="Anomalia registrada" subtitle="Sobrecalentamiento / Sobrepresion / Grasa" accent="#e11d48" />

        <path d="M790 495 H 880" stroke="#e11d48" strokeWidth="2.5" fill="none" markerEnd="url(#arrowAlert)" />
        <EdgeLabel x={835} y={485} text="3 lecturas seguidas" tone="bad" small />

        <NodeBox x={880} y={440} w={220} h={110} icon="bx-bell" title="Alerta de mantenimiento" subtitle="Riesgo: medio / alto / critico" accent="#e11d48" />

        <path d="M990 440 V 340" stroke="#0088cc" strokeWidth="2.5" fill="none" markerEnd="url(#arrow)" />
        <EdgeLabel x={1040} y={390} text="notifica" tone="telegram" />

        <NodeBox x={880} y={200} w={220} h={130} icon="bxl-telegram" title="Notificacion" subtitle="Bot de Telegram → equipo tecnico" accent="#0088cc" />

        <path d="M990 200 V 130" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
        <EdgeLabel x={1040} y={165} text="llega al celular" small />

        <NodeBox x={880} y={20} w={220} h={100} icon="bx-hard-hat" title="Equipo tecnico" subtitle="Ve la alerta al instante" accent="#334155" small />
      </svg>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <LegendDot color="#0ea5e9" label="Origen del dato" />
        <LegendDot color="#8b5cf6" label="Sistema Aleri" />
        <LegendDot color="#e11d48" label="Camino de falla" />
        <LegendDot color="#0088cc" label="Notificacion" />
      </div>
    </div>
  )
}

function NodeBox({ x, y, w, h, icon, title, subtitle, accent, small }) {
  const iconSize = small ? 26 : 32
  const iconTop = y + 14

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={14}
        fill="none"
        stroke={accent}
        strokeWidth={2}
        className="fill-white dark:fill-slate-900"
      />
      <rect x={x} y={y} width={6} height={h} rx={3} fill={accent} />

      <foreignObject x={x + 16} y={iconTop} width={iconSize} height={iconSize}>
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: iconSize, height: iconSize, backgroundColor: `${accent}22` }}
        >
          <i className={`bx ${icon}`} style={{ color: accent, fontSize: small ? 15 : 18 }} />
        </div>
      </foreignObject>

      <text x={x + 16 + iconSize + 10} y={iconTop + iconSize / 2 + 5} fontSize={14} fontWeight={600} className="fill-slate-800 dark:fill-slate-100">
        {title}
      </text>

      <foreignObject x={x + 18} y={iconTop + iconSize + 8} width={w - 36} height={h - iconSize - 34}>
        <p className="text-[11.5px] leading-snug text-slate-500 dark:text-slate-400" style={{ margin: 0 }}>
          {subtitle}
        </p>
      </foreignObject>
    </g>
  )
}

function SensorDot({ x, y }) {
  return (
    <g>
      <circle cx={x} cy={y} r={6} fill="#0ea5e9" />
      <circle cx={x} cy={y} r={10} fill="none" stroke="#0ea5e9" strokeWidth={1.5} opacity={0.5}>
        <animate attributeName="r" values="6;14;6" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
      </circle>
    </g>
  )
}

function EdgeLabel({ x, y, text, tone, small }) {
  const color = tone === 'bad' ? '#e11d48' : tone === 'good' ? '#16a34a' : tone === 'telegram' ? '#0088cc' : undefined
  return (
    <text
      x={x}
      y={y}
      fontSize={small ? 10.5 : 11.5}
      textAnchor="middle"
      fill={color}
      className={color ? undefined : 'fill-slate-500 dark:fill-slate-400'}
      fontStyle="italic"
    >
      {text}
    </text>
  )
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

function MonthlyDowntimeCard() {
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    reportsApi
      .monthlyDowntime({ months: 12 })
      .then((res) => setData(res.data))
      .catch(() => setLoadError('No se pudo cargar el comparativo mensual.'))
  }, [])

  const totalHours = (data || []).reduce((sum, m) => sum + m.downtime_hours_avoided, 0)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <i className="bx bx-bar-chart-alt-2 text-base text-violet-400" />
            Comparativo mensual de downtime evitado
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Horas de downtime evitadas por mes gracias al mantenimiento predictivo — argumento del ROI del sistema.
          </p>
        </div>

        {data && (
          <span className="whitespace-nowrap rounded-full bg-brand-500/10 px-3 py-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400">
            {totalHours.toFixed(1)} h en 12 meses
          </span>
        )}
      </div>

      {loadError ? (
        <p className="py-8 text-center text-sm text-rose-600 dark:text-rose-400">{loadError}</p>
      ) : !data ? (
        <p className="py-8 text-center text-sm text-slate-500">Cargando...</p>
      ) : data.every((m) => m.downtime_hours_avoided === 0) ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <i className="bx bx-bar-chart-alt text-3xl text-slate-300 dark:text-slate-700" />
          <p className="mt-3 text-sm text-slate-500">Sin downtime evitado registrado en este periodo.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value) => [`${value} h`, 'Downtime evitado']}
              contentStyle={{
                background: 'var(--color-slate-900, #0f172a)',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
              }}
            />
            <Bar dataKey="downtime_hours_avoided" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function ExportAnomaliesCard() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const params = {}
      if (from) params.from = from
      if (to) params.to = to

      const res = await reportsApi.exportAnomalies(params)
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `reporte-anomalias-${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      Notify.success('Reporte exportado correctamente')
    } catch {
      Notify.failure('No se pudo exportar el reporte.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <i className="bx bx-download text-base text-violet-400" />
            Exportar reporte de anomalías
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Descarga en Excel las anomalías detectadas, causa, severidad y horas de downtime evitadas por equipo.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Desde</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Hasta</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <i className="bx bx-file text-base" />
            {exporting ? 'Generando...' : 'Exportar Excel'}
          </button>
        </div>
      </div>
    </div>
  )
}
