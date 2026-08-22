import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'
import SidebarGroup from './SidebarGroup'
import Notify, { Confirm } from '../lib/notify'

const navGroups = [
  {
    icon: 'bx-car',
    label: 'Flota',
    items: [
      { to: '/flota', label: 'Flota de camiones' },
      { to: '/rutas', label: 'Rutas de acarreo' },
    ],
  },
  {
    icon: 'bx-trip',
    label: 'Operacion',
    items: [
      { to: '/viajes', label: 'Viajes de acarreo' },
      { to: '/ranking', label: 'Ranking eco-conduccion' },
    ],
  },
  {
    icon: 'bx-error-alt',
    label: 'Alertas',
    items: [
      { to: '/anomalias', label: 'Anomalias de combustible' },
      { to: '/alertas-mecanicas', label: 'Alertas mecanicas' },
    ],
  },
  {
    icon: 'bx-id-card',
    label: 'Personal',
    items: [{ to: '/operadores', label: 'Operadores' }],
  },
]

// Sin ruta real todavia: se muestran para completar la estructura del
// sidebar pero quedan deshabilitados hasta que existan esas paginas.
const systemNavItems = [
  { label: 'Configuracion', icon: 'bx-cog' },
  { label: 'Reportes', icon: 'bx-file' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  function handleLogout() {
    Confirm.show(
      'Cerrar sesion',
      '¿Estas seguro de cerrar sesion?',
      'Si, cerrar sesion',
      'Cancelar',
      () => {
        logout()
        Notify.success('Sesion cerrada')
      },
      () => {},
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <aside className="flex h-full w-72 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center justify-between px-5 py-6">
          <div>
            <p className="font-brand text-sm leading-tight text-slate-900 dark:text-slate-100">ALERI</p>
            <p className="text-[10px] leading-tight text-slate-500">Fuel Intelligence</p>
          </div>
          <ThemeToggle />
        </div>

        <nav className="scrollbar-none flex-1 space-y-6 overflow-y-auto px-3 pb-4">
          <div>
            <p className="mb-2 flex items-center gap-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              <span className="h-1 w-1 rounded-full bg-violet-500" />
              Principal
            </p>
            <div className="space-y-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-violet-600 dark:text-violet-300'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-lg bg-violet-100 dark:bg-violet-600/20"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <i className="bx bx-grid-alt relative z-10 text-base" />
                    <span className="relative z-10 flex-1">Dashboard</span>
                  </>
                )}
              </NavLink>

              {navGroups.map((group) => (
                <SidebarGroup key={group.label} {...group} />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <span className="h-1 w-1 rounded-full bg-slate-400 dark:bg-slate-500" />
              Sistema
            </p>
            <div className="space-y-1">
              {systemNavItems.map((item) => (
                <div
                  key={item.label}
                  title="Proximamente"
                  className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 dark:text-slate-600"
                >
                  <i className={`bx ${item.icon} text-base`} />
                  <span className="flex-1">{item.label}</span>
                  <i className="bx bx-chevron-right text-sm opacity-40" />
                </div>
              ))}
            </div>
          </div>
        </nav>

        <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-700 text-white">
              <i className="bx bx-user text-lg" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <i className="bx bx-log-out text-sm" />
            Cerrar sesion
          </motion.button>
        </div>
      </aside>

      <main className="scrollbar-none flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
