export default function Loader({ label = 'Cargando...' }) {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-slate-500">
      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500 dark:border-slate-700 dark:border-t-brand-400" />
      {label}
    </div>
  )
}
