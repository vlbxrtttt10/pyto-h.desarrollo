import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import AnimatedLogo from '../components/AnimatedLogo'
import ThemeToggle from '../components/ThemeToggle'
import Notify from '../lib/notify'

const panelVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

const formVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
}

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

const featureVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut', delay: 0.6 + i * 0.1 },
  }),
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      Notify.success('Ingreso correctamente')
      setSuccess(true)
      setTimeout(() => navigate('/'), 500)
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo iniciar sesion.')
      setLoading(false)
    }
  }

  return (
    <motion.div
      animate={success ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="relative flex min-h-screen overflow-hidden bg-white dark:bg-[#0b0b12]"
    >
      <ThemeToggle className="absolute right-6 top-6 z-20" />

      <div className="flex w-full flex-col justify-center px-8 py-12 sm:px-16 lg:w-1/2 lg:px-20 xl:px-28">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={panelVariants}
          className="mx-auto w-full max-w-sm"
        >
          <div className="mb-10">
            <AnimatedLogo className="h-28 w-80" />
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Inicia sesion en tu cuenta</p>
          </div>

          <motion.form
            onSubmit={handleSubmit}
            className="space-y-5"
            variants={formVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fieldVariants}>
              <label className="mb-1.5 block text-sm text-slate-700 dark:text-slate-300">Correo electronico</label>
              <div className="relative">
                <i className="bx bx-envelope pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="usuario@aleri.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-violet-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-600"
                />
              </div>
            </motion.div>

            <motion.div variants={fieldVariants}>
              <label className="mb-1.5 block text-sm text-slate-700 dark:text-slate-300">Contrasena</label>
              <div className="relative">
                <i className="bx bx-lock-alt pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400 dark:text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Ingresa tu contrasena"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-violet-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                >
                  <i className={`bx ${showPassword ? 'bx-hide' : 'bx-show'} text-lg`} />
                </button>
              </div>
            </motion.div>

            <motion.div variants={fieldVariants} className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 bg-slate-50 text-violet-500 accent-violet-600 dark:border-white/20 dark:bg-white/5"
                />
                Recordar sesion
              </label>
              <a href="#" className="text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300">
                ¿Olvidaste tu contrasena?
              </a>
            </motion.div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-rose-600 dark:text-rose-400"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              variants={fieldVariants}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <i className="bx bx-log-in text-lg" />
              {loading ? 'Ingresando...' : 'Iniciar sesion'}
            </motion.button>
          </motion.form>
        </motion.div>
      </div>

      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2 lg:items-center lg:justify-center bg-violet-50 dark:brand-panel-bg">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-violet-300/50 blur-3xl dark:bg-violet-600/40" />
          <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-indigo-300/40 blur-3xl dark:bg-indigo-600/30" />
          <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-purple-300/40 blur-3xl dark:bg-purple-700/25" />

          <svg className="absolute inset-x-0 bottom-0 h-1/2 w-full opacity-30" viewBox="0 0 800 300" preserveAspectRatio="none">
            <path
              d="M0,180 C150,240 250,120 400,160 C550,200 650,100 800,150 L800,300 L0,300 Z"
              fill="url(#waveGradient)"
            />
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#1e0a4d" stopOpacity="0.05" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-10 flex max-w-md flex-col items-center text-center"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2.25 }}
          >
            <AnimatedLogo className="h-48 w-72 drop-shadow-[0_0_40px_rgba(139,92,246,0.35)] dark:drop-shadow-[0_0_40px_rgba(139,92,246,0.6)]" />
          </motion.div>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 64 }}
            transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
            className="mx-auto mt-4 h-0.5 bg-violet-500 dark:bg-violet-400"
          />

          <h3 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-white">
            Copiloto de Eficiencia Energetica
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-violet-800/70 dark:text-violet-200/80">
            Audita, predice y corrige el consumo de combustible de tu flota minera en tiempo real.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 text-left">
            {[
              { icon: 'bx-check-shield', title: 'Preciso', desc: 'Deteccion de anomalias por IA' },
              { icon: 'bx-bolt-circle', title: 'Tiempo real', desc: 'Alertas al instante' },
              { icon: 'bx-trophy', title: 'Gamificado', desc: 'Ranking de operadores' },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={featureVariants}
                whileHover={{ y: -3 }}
                className="rounded-xl bg-white/60 p-4 backdrop-blur-sm dark:bg-white/5"
              >
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 dark:bg-white/10">
                  <i className={`bx ${feature.icon} text-lg text-violet-600 dark:text-violet-300`} />
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{feature.title}</p>
                <p className="mt-0.5 text-xs text-violet-800/60 dark:text-violet-200/60">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
