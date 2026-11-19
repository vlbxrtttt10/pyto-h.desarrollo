import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Ruta bajo la que se sirve la app; el pipeline de CD la fija a /pyto-h.desarrollo/ para GitHub Pages
  base: process.env.VITE_BASE || '/',
  server: {
    port: 5173,
  },
  build: {
    rolldownOptions: {
      output: {
        // Librerias usadas en todas las pantallas en chunks propios: cambian poco,
        // asi el navegador las mantiene en cache entre despliegues
        codeSplitting: {
          groups: [
            { name: 'react-vendor', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/ },
            { name: 'motion', test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/ },
            { name: 'realtime', test: /node_modules[\\/](laravel-echo|pusher-js)[\\/]/ },
          ],
        },
      },
    },
  },
})
