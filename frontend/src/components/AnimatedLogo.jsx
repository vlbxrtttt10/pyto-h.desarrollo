import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { viewBox, logoLayers } from '../assets/aleriFullLogoPaths'
import { useTheme } from '../context/ThemeContext'

// El texto "ALERI" del logo fuente viene vectorizado en blanco puro; en modo
// claro se pierde sobre fondos claros, asi que se recolorea dinamicamente
// segun el tema (el icono, en azul/magenta, ya tiene buen contraste en ambos).
const TEXT_COLOR = 'rgb(255,255,255)'

const DRAW_DURATION_PER_PATH = 0.25
const STAGGER = 0.04
const HOLD_DURATION = 0.8 // segundos que la silueta se mantiene visible antes del pop

// Aplana las capas en una lista de {d, color, transform} en orden de
// dibujado: icono (azul, luego magenta) y despues el texto "ALERI".
const flatPaths = logoLayers.flatMap((layer) =>
  layer.paths.map((d) => ({ d, color: layer.color, transform: layer.transform }))
)

const lastPathStart = (flatPaths.length - 1) * STAGGER
const drawEnd = lastPathStart + DRAW_DURATION_PER_PATH
const popStart = drawEnd + HOLD_DURATION

/**
 * Dibuja el logotipo real de Aleri (icono "A" + texto ALERI) trazando el
 * contorno de cada forma. La silueta se mantiene visible sin relleno unos
 * segundos, y al terminar la espera el logo entero da un pop de escala
 * mientras se rellena de golpe.
 */
export default function AnimatedLogo({ className = '' }) {
  const [popped, setPopped] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    const timer = setTimeout(() => setPopped(true), popStart * 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <motion.div
      className={`relative ${className}`}
      animate={popped ? { scale: [1, 1.18, 1] } : { scale: 1 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <svg viewBox={viewBox} className="h-full w-full overflow-visible">
        {flatPaths.map(({ d, color, transform }, i) => {
          const resolvedColor = color === TEXT_COLOR && theme === 'light' ? 'rgb(15,23,42)' : color
          return (
            <g key={i} transform={transform || undefined}>
              <motion.path
                d={d}
                stroke={resolvedColor}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={resolvedColor}
                initial={{ pathLength: 0, opacity: 0, fillOpacity: 0 }}
                animate={{
                  pathLength: 1,
                  opacity: 1,
                  fillOpacity: popped ? 1 : 0,
                }}
                transition={{
                  pathLength: {
                    duration: DRAW_DURATION_PER_PATH,
                    delay: i * STAGGER,
                    ease: 'easeInOut',
                  },
                  opacity: { duration: 0.1, delay: i * STAGGER },
                  fillOpacity: { duration: 0.6, ease: 'easeOut' },
                }}
              />
            </g>
          )
        })}
      </svg>
    </motion.div>
  )
}
