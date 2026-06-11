import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [kullanici, setKullanici] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('kullanici')
    if (stored) {
      try {
        setKullanici(JSON.parse(stored))
      } catch {
        // Bozuk kayıt — temizle
        localStorage.removeItem('kullanici')
        localStorage.removeItem('token')
      }
    }
    setLoading(false)
  }, [])

  const login = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('kullanici', JSON.stringify(userData))
    setKullanici(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('kullanici')
    setKullanici(null)
  }

  return (
    <AuthContext.Provider value={{ kullanici, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}