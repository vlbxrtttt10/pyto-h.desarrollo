import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

export default function SidebarGroup({ icon, label, items }) {
  const location = useLocation()
  const hasActiveChild = items.some((item) => item.to === location.pathname)
  const [open, setOpen] = useState(hasActiveChild)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      >
        <i className={`bx ${icon} text-base`} />
        <span className="flex-1 text-left">{label}</span>
        <i className={`bx bx-chevron-down text-sm opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="ml-4 space-y-0.5 border-l border-slate-200 py-1 pl-3 dark:border-slate-800">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
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
                      <span className="relative z-10 h-1 w-1 shrink-0 rounded-full bg-current" />
                      <span className="relative z-10">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
