import { createContext, useContext, useEffect, useState } from 'react'
import { fetchMe, loginUser, logoutUser, registerUser } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setLoading(false)
      return
    }
    fetchMe()
      .then(setUser)
      .catch(() => localStorage.removeItem('auth_token'))
      .finally(() => setLoading(false))
  }, [])

  async function login(credentials) {
    const data = await loginUser(credentials)
    localStorage.setItem('auth_token', data.token)
    setUser(data.user)
    return data.user
  }

  async function register(details) {
    const data = await registerUser(details)
    localStorage.setItem('auth_token', data.token)
    setUser(data.user)
    return data.user
  }

  async function logout() {
    try {
      await logoutUser()
    } catch {
      // ignore network errors on logout, clear local session anyway
    }
    localStorage.removeItem('auth_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
