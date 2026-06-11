import { useState } from 'react'
import api from '../services/api'
import Modal from './Modal'

export default function PasswordModal({ onClose }) {
  const [eskiSifre, setEskiSifre] = useState('')
  const [yeniSifre, setYeniSifre] = useState('')
  const [hata, setHata] = useState('')
  const [basari, setBasari] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setHata('')
    setLoading(true)
    try {
      await api.put('/auth/sifre', {
        eski_sifre: eskiSifre,
        yeni_sifre: yeniSifre
      })
      setBasari(true)
    } catch (err) {
      setHata(err.response?.data?.hata || 'İşlem başarısız')
    } finally {
      setLoading(false)
    }
  }

  if (basari) {
    return (
      <Modal title="Şifre Güncellendi" subtitle="Yeni şifreniz kaydedildi." icon="success" onClose={onClose}>
        <p className="modal-msg">Bir sonraki girişinizde yeni şifrenizi kullanabilirsiniz.</p>
        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>Tamam</button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Şifre Değiştir" subtitle="Güvenliğiniz için eski şifrenizi de girmeniz gerekir." icon="lock" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label>Mevcut şifre</label>
        <input
          type="password"
          value={eskiSifre}
          onChange={(e) => setEskiSifre(e.target.value)}
          required
        />

        <label style={{ marginTop: 14 }}>Yeni şifre (en az 8 karakter)</label>
        <input
          type="password"
          value={yeniSifre}
          onChange={(e) => setYeniSifre(e.target.value)}
          minLength={8}
          required
        />

        {hata && <div className="modal-error">{hata}</div>}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            İptal
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
