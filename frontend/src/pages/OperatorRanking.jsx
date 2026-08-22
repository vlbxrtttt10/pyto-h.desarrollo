import { useEffect, useState } from 'react'
import { dashboardApi } from '../api/resources'
import Loader from '../components/Loader'

const MEDAL_STYLES = [
  { icon: 'bxs-medal', color: 'text-amber-500 dark:text-amber-400' },
  { icon: 'bxs-medal', color: 'text-slate-400 dark:text-slate-300' },
  { icon: 'bxs-medal', color: 'text-orange-500 dark:text-orange-400' },
]

function buildFeedback(operator) {
  const dev = Number(operator.avg_deviation_percent)

  if (dev <= 5) {
    return { text: `Excelente eco-conduccion, apenas ${dev.toFixed(1)}% sobre lo esperado. ¡Sigue asi!`, tone: 'good' }
  }

  const issues = []
  if (Number(operator.total_idle_minutes) / Math.max(operator.trips_count, 1) > 8) {
    issues.push('reducir el tiempo en ralenti durante carguio/descarga')
  }
  if (Number(operator.total_harsh_events) / Math.max(operator.trips_count, 1) > 2) {
    issues.push('suavizar el frenado y la aceleracion')
  }
  if (Number(operator.total_wrong_gear_events) / Math.max(operator.trips_count, 1) > 1) {
    issues.push('usar la marcha correcta en pendientes')
  }

  if (issues.length === 0) {
    return { text: `Desviacion de ${dev.toFixed(1)}%, dentro de un rango aceptable.`, tone: 'neutral' }
  }

  return {
    text: `Recomendacion: ${issues.join(' y ')} para bajar tu desviacion actual de ${dev.toFixed(1)}%.`,
    tone: 'warn',
  }
}

export default function OperatorRanking() {
  const [ranking, setRanking] = useState(null)

  useEffect(() => {
    dashboardApi.operatorRanking().then((res) => setRanking(res.data))
  }, [])

  if (!ranking) return <Loader label="Calculando ranking..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          <i className="bx bx-trophy text-violet-400" />
          Ranking de eco-conduccion
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Menor desviacion de combustible = mejor puesto. Feedback personalizado por operador.
        </p>
      </div>

      <div className="space-y-3">
        {ranking.map((operator, index) => {
          const feedback = buildFeedback(operator)
          const toneClasses = {
            good: 'border-brand-300 bg-brand-500/5 dark:border-brand-700/50',
            neutral: 'border-slate-300 bg-slate-100/60 dark:border-slate-700 dark:bg-slate-800/40',
            warn: 'border-amber-300 bg-amber-500/5 dark:border-amber-700/50',
          }

          return (
            <div
              key={operator.id}
              className={`flex items-center gap-4 rounded-xl border p-4 ${toneClasses[feedback.tone]}`}
            >
              <div className="flex w-12 shrink-0 items-center justify-center text-2xl">
                {MEDAL_STYLES[index] ? (
                  <i className={`bx ${MEDAL_STYLES[index].icon} ${MEDAL_STYLES[index].color}`} />
                ) : (
                  <span className="text-sm font-semibold text-slate-500">#{index + 1}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{operator.name}</p>
                  <p className="text-xs text-slate-500">
                    {operator.employee_code} · {operator.trips_count} viajes
                  </p>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{feedback.text}</p>
              </div>

              <div className="shrink-0 text-right">
                <p
                  className={`text-lg font-semibold ${
                    Number(operator.avg_deviation_percent) <= 5
                      ? 'text-brand-600 dark:text-brand-400'
                      : Number(operator.avg_deviation_percent) <= 15
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {Number(operator.avg_deviation_percent).toFixed(1)}%
                </p>
                <p className="text-xs text-slate-600">desviacion prom.</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
