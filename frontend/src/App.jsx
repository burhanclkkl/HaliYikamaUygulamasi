import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import UserDashboard from './pages/UserDashboard'

function App() {
  const { kullanici, loading } = useAuth()

  useEffect(() => {
    document.title = 'Halı Temizleme Otomasyonu'
  }, [])

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Yükleniyor...</div>
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={kullanici ? <Navigate to="/dashboard" /> : <Login />} />
      <Route 
        path="/dashboard" 
        element={
          !kullanici 
            ? <Navigate to="/login" /> 
            : kullanici.role === 'admin' 
              ? <AdminDashboard />
              : <UserDashboard />
        } 
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App