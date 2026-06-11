import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import ErrorModal from '../components/ErrorModal'
import Footer from '../components/Footer'
import './Login.css'

const Check = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
)
const Eye = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>
)
const EyeOff = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
)

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [errorModal, setErrorModal] = useState(null)
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await api.post('/auth/login', { email, password })
      const { access_token, kullanici } = response.data
      login(kullanici, access_token)
      navigate('/dashboard')
    } catch (err) {
      const mesaj = err.response?.data?.hata || 'Bir hata oluştu'
      setErrorModal({
        baslik: err.response?.status === 429 ? 'Güvenlik Uyarısı' : 'Giriş Başarısız',
        mesaj,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-split">
        {/* SOL: marka paneli (kırmızı committed) */}
        <aside className="login-brand">
          <div className="login-brand-inner">
            <div className="login-logo-row">
              <span className="login-logo-mark" aria-hidden="true">H</span>
              <span>Halı Yıkama <em>Uygulaması</em></span>
            </div>
            <h2 className="login-brand-title">Halı yıkama işletmenizi tek ekrandan yönetin.</h2>
            <p className="login-brand-sub">
              Sipariş, ölçüm, durum takibi, WhatsApp bildirimi ve tahsilat. Hepsi tek panoda, her zaman net.
            </p>
            <ul className="login-brand-points">
              <li><span className="lp-check"><Check /></span> m² otomatik hesaplama ve PDF irsaliye</li>
              <li><span className="lp-check"><Check /></span> WhatsApp ile anında durum bildirimi</li>
              <li><span className="lp-check"><Check /></span> Tahsilat ve kalan bakiye takibi</li>
            </ul>
          </div>
        </aside>

        {/* SAĞ: giriş formu */}
        <main className="login-form-side">
          <div className="login-card">
            <div className="login-card-mark">
              <span className="login-logo-mark" aria-hidden="true">H</span>
              <span>Halı Yıkama <em>Uygulaması</em></span>
            </div>

            <h1>Giriş yap</h1>
            <p className="login-card-sub">Hesabınıza erişmek için bilgilerinizi girin.</p>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="field">
                <label htmlFor="email">E-posta</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@hali.com"
                  required
                  autoFocus
                />
              </div>

              <div className="field">
                <label htmlFor="password">Şifre</label>
                <div className="password-wrap">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="En az 8 karakter"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="pw-toggle"
                    onClick={() => setShowPw((s) => !s)}
                    aria-label={showPw ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  >
                    {showPw ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? 'Giriş yapılıyor…' : 'Giriş yap'}
              </button>
            </form>
          </div>
        </main>
      </div>

      <Footer />

      {errorModal && (
        <ErrorModal
          baslik={errorModal.baslik}
          mesaj={errorModal.mesaj}
          onClose={() => setErrorModal(null)}
        />
      )}
    </div>
  )
}
