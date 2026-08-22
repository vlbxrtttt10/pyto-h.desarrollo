export default function StatCard({ label, value, hint, tone = 'default', icon }) {
  const toneClasses = {
    default: 'text-slate-900 dark:text-slate-100',
    good: 'text-brand-600 dark:text-brand-400',
    warn: 'text-amber-600 dark:text-amber-400',
    bad: 'text-rose-600 dark:text-rose-400',
  }

  const iconToneClasses = {
    default: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    good: 'bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
    warn: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    bad: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        {icon && (
          <span className={`flex h-9 w-9 items-center justify-center rounded-full ${iconToneClasses[tone]}`}>
            <i className={`bx ${icon} text-base`} />
          </span>
        )}
      </div>
      <p className={`mt-2 text-2xl font-semibold ${toneClasses[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
