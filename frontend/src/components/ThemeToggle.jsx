import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle({ className = '', variant = 'auto' }) {
  const { theme, toggleTheme } = useTheme()

  const variantClasses =
    variant === 'dark'
      ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
      : 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-700'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${variantClasses} ${className}`}
    >
      <i className={`bx ${theme === 'dark' ? 'bx-sun' : 'bx-moon'} text-lg`} />
    </button>
  )
}
