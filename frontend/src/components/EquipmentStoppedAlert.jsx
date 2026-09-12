import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import echo from '../lib/echo'

const RISK_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Critica' }

export default function EquipmentStoppedAlert() {
  const [alerts, setAlerts] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const channel = echo.channel('dashboard')

    channel.listen('.equipment.stopped', (payload) => {
      setAlerts((prev) => [{ ...payload, key: `${payload.alert_id}-${payload.stopped_at}` }, ...prev])
    })

    return () => {
      channel.stopListening('.equipment.stopped')
    }
  }, [])

  function dismiss(key) {
    setAlerts((prev) => prev.filter((a) => a.key !== key))
  }

  function goToEquipment(alert) {
    dismiss(alert.key)
    navigate('/equipos')
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex flex-col items-center gap-2 p-3">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.key}
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-xl border border-rose-400/60 bg-rose-600 px-4 py-3 text-white shadow-2xl shadow-rose-900/40"
          >
            <motion.span
              animate={{ scale: [1, 1.35, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15"
            >
              <i className="bx bx-stop-circle text-xl" />
            </motion.span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                Equipo {alert.equipment_code} detenido por Telegram
              </p>
              <p className="truncate text-xs text-rose-100">
                {alert.equipment_client} · Riesgo {RISK_LABELS[alert.risk_level] || alert.risk_level} · Paso a estado "En falla"
              </p>
            </div>

            <button
              type="button"
              onClick={() => goToEquipment(alert)}
              className="shrink-0 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25"
            >
              Ver equipo
            </button>
            <button
              type="button"
              onClick={() => dismiss(alert.key)}
              aria-label="Cerrar"
              className="shrink-0 rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
            >
              <i className="bx bx-x text-lg" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
