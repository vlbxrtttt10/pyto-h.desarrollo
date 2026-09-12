import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Loader from './components/Loader'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

import Equipos from './pages/Equipos/Equipos'

import Componentes from './pages/Componentes/Componentes'

import Lecturas from './pages/Lecturas/Lecturas'

import Anomalias from './pages/Anomalias/Anomalias'
import AlertasMantenimiento from './pages/AlertasMantenimiento/AlertasMantenimiento'

import Reportes from './pages/Reportes/Reportes'

import Usuarios from './pages/Usuarios/Usuarios'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader label="Verificando sesion..." />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  return (
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

        <Route path="componentes" element={<Componentes />} />

        <Route path="lecturas" element={<Lecturas />} />

        <Route path="anomalias" element={<Anomalias />} />
        <Route path="alertas-mantenimiento" element={<AlertasMantenimiento />} />

        <Route path="reportes" element={<Reportes />} />

        <Route path="usuarios" element={<Usuarios />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
