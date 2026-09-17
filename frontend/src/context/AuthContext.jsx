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
    }
    localStorage.removeItem('aleri_token')
    setUser(null)
  }

  function hasModulePermission(module, action = 'can_view') {
    if (!user) return false
    if (user.is_super_admin) return true

    const permission = user.module_permissions?.find((p) => p.module === module)
    return Boolean(permission?.[action])
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasModulePermission }}>
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
