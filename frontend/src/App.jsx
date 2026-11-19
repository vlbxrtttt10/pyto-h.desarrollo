import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Loader from './components/Loader'

// Cada pagina se descarga recien cuando se navega a ella (un chunk por pagina)
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))

const Equipos = lazy(() => import('./pages/Equipos/Equipos'))
const EquipoDetalle = lazy(() => import('./pages/Equipos/EquipoDetalle'))

const Componentes = lazy(() => import('./pages/Componentes/Componentes'))

const Lecturas = lazy(() => import('./pages/Lecturas/Lecturas'))

const Anomalias = lazy(() => import('./pages/Anomalias/Anomalias'))
const AlertasMantenimiento = lazy(() => import('./pages/AlertasMantenimiento/AlertasMantenimiento'))

const Reportes = lazy(() => import('./pages/Reportes/Reportes'))

const Usuarios = lazy(() => import('./pages/Usuarios/Usuarios'))

function FullScreenLoader({ label }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <Loader label={label} />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <FullScreenLoader label="Verificando sesion..." />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  return (
    <Suspense fallback={<FullScreenLoader label="Cargando..." />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />

          <Route path="equipos" element={<Equipos />} />
          <Route path="equipos/:id" element={<EquipoDetalle />} />

          <Route path="componentes" element={<Componentes />} />

          <Route path="lecturas" element={<Lecturas />} />

          <Route path="anomalias" element={<Anomalias />} />
          <Route path="alertas-mantenimiento" element={<AlertasMantenimiento />} />

          <Route path="reportes" element={<Reportes />} />

          <Route path="usuarios" element={<Usuarios />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
