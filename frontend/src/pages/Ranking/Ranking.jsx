import { useEffect, useState } from 'react'
import { dashboardApi } from '../../api/resources'
import Loader from '../../components/Loader'

const MEDAL_STYLES = [
  { icon: 'bxs-medal', color: 'text-amber-500 dark:text-amber-400' },
  { icon: 'bxs-medal', color: 'text-slate-400 dark:text-slate-300' },
  { icon: 'bxs-medal', color: 'text-orange-500 dark:text-orange-400' },
]

function buildFeedback(technician) {
  const dev = Number(technician.avg_deviation_percent)

  if (dev <= 5) {
    return { text: `Excelente precision en campo, apenas ${dev.toFixed(1)}% de desviacion promedio. ¡Sigue asi!`, tone: 'good' }
  }

  if (dev <= 15) {
    return { text: `Desviacion promedio de ${dev.toFixed(1)}%, dentro de un rango aceptable.`, tone: 'neutral' }
  }

  return {
    text: `Desviacion promedio de ${dev.toFixed(1)}%: revisar procedimiento de lectura y calibracion de instrumentos.`,
    tone: 'warn',
  }
}

export default function Ranking() {
  const [ranking, setRanking] = useState(null)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    dashboardApi
      .technicianRanking()
      .then((res) => setRanking(res.data))
      .catch((err) => setLoadError(err.response?.data?.message || 'No se pudo calcular el ranking.'))
  }, [])

  if (loadError) {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-500/5 p-8 text-center text-sm text-rose-600 dark:border-rose-700/50 dark:text-rose-400">
        {loadError}
      </p>
    )
  }

  if (!ranking) return <Loader label="Calculando ranking..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          <i className="bx bx-trophy text-violet-400" />
          Ranking de tecnicos
        </h1>
        <p className="mt-1 text-sm text-slate-500">Ordenado por menor desviacion promedio en sus visitas de servicio.</p>
      </div>

      <div className="space-y-3">
        {ranking.map((technician, index) => {
          const feedback = buildFeedback(technician)
          const medal = MEDAL_STYLES[index]

          return (
            <div
              key={technician.id}
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                {medal ? (
                  <i className={`bx ${medal.icon} text-2xl ${medal.color}`} />
                ) : (
                  <span className="text-sm font-semibold text-slate-400">#{index + 1}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{technician.name}</p>
                <p className="text-xs text-slate-500">{technician.employee_code} · {technician.visits_count} visitas</p>
                <p
                  className={`mt-1 text-xs ${
                    feedback.tone === 'good'
                      ? 'text-brand-600 dark:text-brand-400'
                      : feedback.tone === 'warn'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-500'
                  }`}
                >
                  {feedback.text}
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  {Number(technician.avg_deviation_percent).toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500">desviacion promedio</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
