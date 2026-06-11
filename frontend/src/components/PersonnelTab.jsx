import { useState, useEffect } from 'react'
import api from '../services/api'
import ErrorModal from './ErrorModal' // Yeni
import ConfirmModal from './ConfirmModal' // Yeni
import Modal from './Modal'
import { formatTelefon, formatPhoneInput } from '../utils/helpers'

export default function PersonnelTab() {
  const [personeller, setPersoneller] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ ad: '', soyad: '', email: '', telefon: '', password: '' })

  // Hata ve Onay Modalları
  const [errorModal, setErrorModal] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  const [passModal, setPassModal] = useState(null)
  const [yeniSifre, setYeniSifre] = useState('')

  // Personel Düzenleme Modal State'i
  const [editModal, setEditModal] = useState(null)
  const [editForm, setEditForm] = useState({ ad: '', soyad: '', telefon: '', email: '' })

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const res = await api.get('/personnel')
      setPersoneller(res.data)
    } catch (err) { 
      setErrorModal({ baslik: "Hata", mesaj: "Personel listesi yüklenemedi." })
    }
    finally { setLoading(false) } // Hata olsa bile loading'i kapat
  }

  const save = async (e) => {
    e.preventDefault()
    
    const temizTel = form.telefon.replace(/\D/g, '')
    if (temizTel.length > 0 && temizTel.length < 10) {
      setErrorModal({ baslik: "Geçersiz Telefon", mesaj: "Lütfen en az 10 haneli geçerli bir telefon numarası girin." })
      return
    }

    try {
      await api.post('/personnel', { ...form, telefon: temizTel })
      setModal(false)
      setForm({ ad: '', soyad: '', email: '', telefon: '', password: '' })
      load()
    } catch (err) { setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Personel eklenirken bir hata oluştu.' }) }
  }

  // ========== PERSONEL DUZENLE ==========
  const openEdit = (p) => {
    setEditForm({
      ad: p.ad || '',
      soyad: p.soyad || '',
      telefon: p.telefon || '',
      email: p.email || ''
    })
    setEditModal(p)
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      setErrorModal({ baslik: "Geçersiz E-posta", mesaj: "Lütfen geçerli bir e-posta adresi girin." })
      return
    }

    const temizTel = editForm.telefon.replace(/\D/g, '');
    if (temizTel.length > 0 && temizTel.length < 10) {
      setErrorModal({ baslik: "Geçersiz Telefon", mesaj: "Telefon numarası en az 10 hane olmalıdır." })
      return
    }

    try {
      await api.put(`/personnel/${editModal.id}`, { ...editForm, telefon: temizTel })
      setEditModal(null)
      load()
    } catch (err) {
      setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Personel güncellenemedi.' })
    }
  }

  const toggle = async (p) => {
    try {
      await api.put(`/personnel/${p.id}/aktif`)
      load()
    } catch (err) { setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Personel durumu güncellenemedi.' }) }
  }

  const changePass = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/personnel/${passModal.id}/password`, { yeni_sifre: yeniSifre })
      setPassModal(null)
      setYeniSifre('')
      setErrorModal({ baslik: "Başarılı", mesaj: "Şifre başarıyla güncellendi." }) // Başarı mesajı için de modal kullan
    } catch (err) { setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Şifre güncellenirken bir hata oluştu.' }) }
  }

  const sil = async (p) => {
    setConfirmModal({
      baslik: "Personel Sil",
      mesaj: `${p.ad} ${p.soyad} adlı personeli silmek istediğinize emin misiniz?`,
      onConfirm: async () => {
        setConfirmModal(null)
        try {
          await api.delete(`/personnel/${p.id}`)
          load()
        } catch (err) {
          setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Personel silinirken bir hata oluştu.' })
        }
      }
    })
  }

  return (
    <section className="card">
      <div className="card-header">
        <h2>Personellerim ({personeller.length})</h2>
        <button className="btn-primary" onClick={() => setModal(true)}>+ Yeni Personel</button>
      </div>

      <div className="modal-info" style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '14px', color: 'var(--color-text)' }}>
          <strong>Bilgi:</strong> Buraya eklediğiniz personeller, kendi e-posta ve şifreleriyle sisteme giriş yapabilirler. 
          Ekledikleri tüm müşteri ve siparişler <strong>ortak havuzda</strong> toplanır ve siz de görebilirsiniz.
        </p>
      </div>

      {loading ? <p className="empty">Yükleniyor...</p> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th>E-posta / Tel</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {personeller.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.ad} {p.soyad}</strong></td>
                  <td>
                    <div>{p.email}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{p.telefon || '—'}</div>
                  </td>
                  <td>
                    <button className={`status-toggle ${p.aktif ? 'aktif' : 'pasif'}`} onClick={() => toggle(p)}>
                      {p.aktif ? '● Aktif' : '○ Pasif'}
                    </button>
                  </td>
                  <td className="actions">
                    <button className="btn-sm" onClick={() => openEdit(p)}>Düzenle</button>
                    <button className="btn-sm" onClick={() => setPassModal(p)}>Şifre</button>
                    <button className="btn-sm btn-danger" onClick={() => sil(p)}>Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title="Yeni Personel Ekle" subtitle="Personel kendi e-posta ve şifresiyle giriş yapabilir." icon="info" onClose={() => setModal(false)}>
          <form onSubmit={save}>
            <label>Ad</label><input required value={form.ad} onChange={e => setForm({...form, ad: e.target.value})} />
            <label style={{ marginTop: 12 }}>Soyad</label><input required value={form.soyad} onChange={e => setForm({...form, soyad: e.target.value})} />
            <label style={{ marginTop: 12 }}>E-posta</label><input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            <label style={{ marginTop: 12 }}>Telefon</label><input type="tel" value={form.telefon} onChange={e => setForm({...form, telefon: formatPhoneInput(e.target.value)})} placeholder="0 5XX XXX XX XX" />
            <label style={{ marginTop: 12 }}>Şifre</label><input type="password" required minLength={8} value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setModal(false)}>İptal</button>
              <button type="submit" className="btn-primary">Personel Ekle</button>
            </div>
          </form>
        </Modal>
      )}

      {/* PERSONEL DUZENLE MODAL */}
      {editModal && (
        <Modal title="Personel Düzenle" subtitle={`${editModal.email} bilgilerini güncelliyorsunuz.`} onClose={() => setEditModal(null)}>
          <form onSubmit={saveEdit}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label>Ad</label>
                <input type="text" required value={editForm.ad} onChange={e => setEditForm({...editForm, ad: e.target.value})} />
              </div>
              <div style={{ flex: 1 }}>
                <label>Soyad</label>
                <input type="text" required value={editForm.soyad} onChange={e => setEditForm({...editForm, soyad: e.target.value})} />
              </div>
            </div>
            <label style={{ marginTop: 10 }}>E-posta</label>
            <input type="email" required value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />

            <label style={{ marginTop: 10 }}>Telefon</label>
            <input type="tel" value={editForm.telefon} onChange={e => setEditForm({...editForm, telefon: formatPhoneInput(e.target.value)})} placeholder="0 5XX XXX XX XX" />

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditModal(null)}>İptal</button>
              <button type="submit" className="btn-primary">Güncelle</button>
            </div>
          </form>
        </Modal>
      )}

      {passModal && (
        <Modal title="Şifre Değiştir" subtitle={`${passModal.ad} ${passModal.soyad} için yeni şifre.`} icon="lock" onClose={() => setPassModal(null)}>
          <form onSubmit={changePass}>
            <label>Yeni Şifre</label>
            <input type="password" required minLength={8} value={yeniSifre} onChange={e => setYeniSifre(e.target.value)} />
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setPassModal(null)}>İptal</button>
              <button type="submit" className="btn-primary">Güncelle</button>
            </div>
          </form>
        </Modal>
      )}

      {/* GENEL HATA MODALI */}
      {errorModal && (
        <ErrorModal
          baslik={errorModal.baslik}
          mesaj={errorModal.mesaj}
          onClose={() => setErrorModal(null)}
        />
      )}
      {/* GENEL ONAY MODALI */}
      {confirmModal && (
        <ConfirmModal {...confirmModal} onClose={() => setConfirmModal(null)} />
      )}
    </section>
  )
}