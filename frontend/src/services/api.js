import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:5001',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Her istekte token'i otomatik ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 401 alırsak token expired - logout yap
// AMA login istegi 401 verirse normal hata (yanlis sifre)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginRequest = error.config?.url?.includes('/auth/login')
        const isRegisterRequest = error.config?.url?.includes('/auth/register')
        
        if (error.response?.status === 401 && !isLoginRequest && !isRegisterRequest) {
            localStorage.removeItem('token')
            localStorage.removeItem('kullanici')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api