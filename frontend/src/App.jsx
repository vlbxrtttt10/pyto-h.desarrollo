import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Loader from './components/Loader'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

import Equipos from './pages/Equipos/Equipos'
import EquipoCreate from './pages/Equipos/EquipoCreate'
import EquipoShow from './pages/Equipos/EquipoShow'

import Componentes from './pages/Componentes/Componentes'
import ComponenteCreate from './pages/Componentes/ComponenteCreate'

import Tecnicos from './pages/Tecnicos/Tecnicos'
import TecnicoCreate from './pages/Tecnicos/TecnicoCreate'
import TecnicoShow from './pages/Tecnicos/TecnicoShow'

import Visitas from './pages/Visitas/Visitas'
import VisitaCreate from './pages/Visitas/VisitaCreate'
import VisitaShow from './pages/Visitas/VisitaShow'

import Anomalias from './pages/Anomalias/Anomalias'
import AlertasMantenimiento from './pages/AlertasMantenimiento/AlertasMantenimiento'
import Ranking from './pages/Ranking/Ranking'

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
        <Route path="equipos/crear" element={<EquipoCreate />} />
        <Route path="equipos/:id" element={<EquipoShow />} />

        <Route path="componentes" element={<Componentes />} />
        <Route path="componentes/crear" element={<ComponenteCreate />} />

        <Route path="tecnicos" element={<Tecnicos />} />
        <Route path="tecnicos/crear" element={<TecnicoCreate />} />
        <Route path="tecnicos/:id" element={<TecnicoShow />} />

        <Route path="visitas" element={<Visitas />} />
        <Route path="visitas/crear" element={<VisitaCreate />} />
        <Route path="visitas/:id" element={<VisitaShow />} />

        <Route path="anomalias" element={<Anomalias />} />
        <Route path="alertas-mantenimiento" element={<AlertasMantenimiento />} />
        <Route path="ranking" element={<Ranking />} />

        <Route path="usuarios" element={<Usuarios />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
