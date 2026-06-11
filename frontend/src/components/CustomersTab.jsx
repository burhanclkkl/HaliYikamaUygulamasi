import { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import ErrorModal from './ErrorModal' // Yeni
import ConfirmModal from './ConfirmModal' // Yeni
import Modal from './Modal'
import { formatTelefon, formatPhoneInput, getCleanPhoneNumber, capitalize } from '../utils/helpers'

/* Tutarlı stroke SVG ikon ailesi — emoji yok */
const ico = {
  phone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
  pin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  navigate: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>,
  wa: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" /></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
}

const basHarf = (m) => `${(m.ad || '').charAt(0)}${(m.soyad || '').charAt(0)}`.toLocaleUpperCase('tr-TR')

export default function CustomersTab() {
  const [musteriler, setMusteriler] = useState([])
  const [loading, setLoading] = useState(true)
  const [arama, setArama] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ ad: '', soyad: '', telefon: '', adres: '' })

  // Hata ve Onay Modalları
  const [errorModal, setErrorModal] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const res = await api.get('/customers')
      if (Array.isArray(res.data)) {
        setMusteriler(res.data)
      } else {
        setMusteriler(res.data.musteriler || [])
      }
    } catch (err) {
      setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Müşteriler yüklenirken bir hata oluştu.' })
    } finally {
      setLoading(false)
    }
  }

  const openNew = () => {
    setForm({ ad: '', soyad: '', telefon: '', adres: '' })
    setModal({ mode: 'new' })
  }

  const openEdit = (m) => {
    setForm({
      ad: m.ad,
      soyad: m.soyad,
      telefon: m.telefon,
      adres: m.adres || ''
    })
    setModal({ mode: 'edit', data: m })
  }

  const save = async (e) => {
    e.preventDefault()

    const temizTel = form.telefon.replace(/\D/g, '')
    if (temizTel.length < 10) {
      setErrorModal({ baslik: "Geçersiz Telefon", mesaj: "Lütfen en az 10 haneli geçerli bir telefon numarası girin." })
      return
    }

    try {
      const payload = {
        ad: capitalize(form.ad.trim()),
        soyad: capitalize(form.soyad.trim()),
        telefon: temizTel,
        adres: form.adres.trim() || null
      }

      if (modal.mode === 'new') {
        await api.post('/customers', payload)
      } else {
        await api.put(`/customers/${modal.data.id}`, payload)
      }
      setModal(null)
      load()
    } catch (err) {
      setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Müşteri kaydedilirken bir hata oluştu.' })
    }
  }

  const sil = async (m) => {
    setConfirmModal({
      baslik: "Müşteri Sil",
      mesaj: `${m.ad} ${m.soyad} adlı müşteriyi silmek istediğinize emin misiniz?`,
      onConfirm: async () => {
        setConfirmModal(null) // Modalı hemen kapat
        try {
          await api.delete(`/customers/${m.id}`)
          load()
        } catch (err) {
          setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Müşteri silinirken bir hata oluştu.' })
        }
      }
    })
  }

  // Arama filtresi
  const filtreliMusteriler = useMemo(() => {
    const aramaLower = arama.toLocaleLowerCase('tr-TR')
    return musteriler.filter(m => {
      if (!arama.trim()) return true
      const tamAd = `${m.ad} ${m.soyad}`.toLocaleLowerCase('tr-TR')
      const tel = (m.telefon || '').replace(/\D/g, '')
      const adr = (m.adres || '').toLocaleLowerCase('tr-TR')
      const aramaTel = arama.replace(/\D/g, '')
      return (
        tamAd.includes(aramaLower) ||
        adr.includes(aramaLower) ||
        (aramaTel && tel.includes(aramaTel))
      )
    });
  }, [musteriler, arama]);

  return (
    <section className="card">
      <div className="card-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between' }}>
        <h2>Müşteriler ({filtreliMusteriler.length}{arama && `/${musteriler.length}`})</h2>
        <button className="btn-primary" onClick={openNew}>+ Yeni Müşteri</button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Ad, telefon veya adres ile ara..."
          value={arama}
          onChange={(e) => setArama(e.target.value)}
        />
        {arama && (
          <button className="search-clear" onClick={() => setArama('')}>✕</button>
        )}
      </div>

      {loading ? (
        <p className="empty">Yükleniyor...</p>
      ) : filtreliMusteriler.length === 0 ? (
        <p className="empty">
          {arama ? 'Aramaya uygun müşteri bulunamadı.' : 'Henüz müşteri yok. Sağ üstten ekleyebilirsiniz.'}
        </p>
      ) : (
        <div className="ent-grid">
          {filtreliMusteriler.map(m => (
            <div key={m.id} className="ent-card">
              <div className="ent-head">
                <span className="ent-avatar">{basHarf(m)}</span>
                <div className="ent-head-text">
                  <div className="ent-name">{m.ad} {m.soyad}</div>
                  <div className="ent-sub">{formatTelefon(m.telefon)}</div>
                </div>
              </div>

              <div className="ent-body">
                <div className="ent-row">
                  {ico.phone}
                  <a href={`tel:${m.telefon}`} title="Aramak için tıklayın">{formatTelefon(m.telefon)}</a>
                </div>
                {m.adres && (
                  <div className="ent-row">
                    {ico.pin}
                    <span className="ent-ellipsis" title={m.adres}>{m.adres}</span>
                    <a
                      className="ent-chip"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.adres)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Google Maps'te aç"
                    >
                      Konum {ico.navigate}
                    </a>
                  </div>
                )}
              </div>

              <div className="ent-foot">
                <a
                  href={`https://api.whatsapp.com/send?phone=${getCleanPhoneNumber(m.telefon)}&text=${encodeURIComponent(`Merhaba ${m.ad} ${m.soyad}, `)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ent-btn wa"
                >
                  {ico.wa} WhatsApp
                </a>
                <span className="ent-foot-spacer" />
                <button className="ent-ico-btn" onClick={() => openEdit(m)} title="Müşteriyi düzenle" aria-label="Müşteriyi düzenle">{ico.edit}</button>
                <button className="ent-ico-btn danger" onClick={() => sil(m)} title="Müşteriyi sil" aria-label="Müşteriyi sil">{ico.trash}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal
          title={modal.mode === 'new' ? 'Yeni Müşteri' : 'Müşteri Düzenle'}
          subtitle={modal.mode === 'new' ? 'Yeni bir müşteri kaydı oluşturun.' : `${modal.data.ad} ${modal.data.soyad} bilgilerini güncelleyin.`}
          icon={modal.mode === 'new' ? 'info' : null}
          onClose={() => setModal(null)}
        >
          <form onSubmit={save}>
            <label>Ad *</label>
            <input
              type="text"
              value={form.ad}
              onChange={(e) => setForm({ ...form, ad: e.target.value })}
              required
            />

            <label style={{ marginTop: 12 }}>Soyad *</label>
            <input
              type="text"
              value={form.soyad}
              onChange={(e) => setForm({ ...form, soyad: e.target.value })}
              required
            />

            <label style={{ marginTop: 12 }}>Telefon *</label>
            <input
              type="tel"
              value={form.telefon}
              onChange={(e) => setForm({ ...form, telefon: formatPhoneInput(e.target.value) })}
              placeholder="0 532 123 45 67"
              required
            />

            <label style={{ marginTop: 12 }}>Adres</label>
            <textarea
              rows={3}
              value={form.adres}
              onChange={(e) => setForm({ ...form, adres: e.target.value })}
              placeholder="Mahalle, sokak, kapı no, ilçe, il"
            />

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>
                İptal
              </button>
              <button type="submit" className="btn-primary">
                {modal.mode === 'new' ? 'Ekle' : 'Kaydet'}
              </button>
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
