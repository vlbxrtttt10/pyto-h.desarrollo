import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Loader from './components/Loader'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import HaulTrips from './pages/HaulTrips'
import FuelAnomalies from './pages/FuelAnomalies'
import MechanicalAlerts from './pages/MechanicalAlerts'
import OperatorRanking from './pages/OperatorRanking'
import Trucks from './pages/Trucks'
import Operators from './pages/Operators'
import HaulRoutes from './pages/HaulRoutes'

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
        <Route path="viajes" element={<HaulTrips />} />
        <Route path="anomalias" element={<FuelAnomalies />} />
        <Route path="alertas-mecanicas" element={<MechanicalAlerts />} />
        <Route path="ranking" element={<OperatorRanking />} />
        <Route path="flota" element={<Trucks />} />
        <Route path="operadores" element={<Operators />} />
        <Route path="rutas" element={<HaulRoutes />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
