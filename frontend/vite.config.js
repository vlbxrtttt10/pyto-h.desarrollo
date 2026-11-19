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
})
