const SEVERITY_STYLES = {
  low: 'bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300',
  medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  high: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
  critical: 'bg-rose-500/20 text-rose-800 dark:bg-rose-600/25 dark:text-rose-300',
}

const CAUSE_LABELS = {
  excessive_idling: 'Ralenti excesivo',
  harsh_driving: 'Conduccion agresiva',
  wrong_gear_usage: 'Uso incorrecto de marchas',
  possible_mechanical_fault: 'Posible falla mecanica',
  unknown: 'Causa desconocida',
}

export function SeverityBadge({ severity }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
        SEVERITY_STYLES[severity] || SEVERITY_STYLES.low
      }`}
    >
      {severity}
    </span>
  )
}

export function CauseBadge({ cause }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
      {CAUSE_LABELS[cause] || cause}
    </span>
  )
}

export { CAUSE_LABELS }
