import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/resources'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('aleri_token')
    if (!token) {
      setLoading(false)
      return
    }

    authApi
      .me()
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('aleri_token'))
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const res = await authApi.login(email, password)
    localStorage.setItem('aleri_token', res.data.token)
    setUser(res.data.user)
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // Ignorar errores de red al cerrar sesion; el token local se limpia igual.
    }
    localStorage.removeItem('aleri_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return ctx
}
