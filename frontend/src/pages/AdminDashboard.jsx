import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import ErrorModal from '../components/ErrorModal' // Yeni
import ConfirmModal from '../components/ConfirmModal' // Yeni
import PasswordModal from '../components/PasswordModal'
import Modal from '../components/Modal'
import './AdminDashboard.css'
import { formatPhoneInput, formatTelefon, formatTarih } from '../utils/helpers'

/* ==========================================================
   Geçerlilik tarihine göre abonelik durumu.
   Eşik (yaklaşıyor = 7 gün) bir iş kararıdır; istenirse
   tek satırdan değiştirilebilir.
   ========================================================== */
const GECERLILIK_UYARI_GUN = 7

function gecerlilikDurumu(tarih) {
  if (!tarih) return { tip: 'sinirsiz', etiket: 'Sınırsız' }
  const bugun = new Date(); bugun.setHours(0, 0, 0, 0)
  const hedef = new Date(tarih); hedef.setHours(0, 0, 0, 0)
  const farkGun = Math.round((hedef - bugun) / 86400000)
  if (farkGun < 0) return { tip: 'doldu', etiket: 'Süresi doldu' }
  if (farkGun <= GECERLILIK_UYARI_GUN) return { tip: 'yaklasiyor', etiket: `${farkGun} gün kaldı` }
  return { tip: 'aktif', etiket: 'Geçerli' }
}

/* Küçük inline ikon seti — dış bağımlılık yok */
const Icon = {
  genel: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  activity: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  team: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  alert: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  menu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  key: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  chevron: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
}

export default function AdminDashboard() {
  const { kullanici, logout } = useAuth()
  const [kullanicilar, setKullanicilar] = useState([])
  const [loading, setLoading] = useState(true)

  // Aktif görünüm + mobil sidebar
  const [gorunum, setGorunum] = useState('genel') // 'genel' | 'kullanicilar' | 'aktivite'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Aktivite (birleştirilmiş loglar)
  const [aktiviteLoglar, setAktiviteLoglar] = useState([])
  const [aktiviteLoading, setAktiviteLoading] = useState(false)

  // Filtreleme State'leri
  const [arama, setArama] = useState('')
  const [rolFiltre, setRolFiltre] = useState('hepsi')
  const [durumFiltre, setDurumFiltre] = useState('hepsi')

  // Limit modal state
  const [limitModal, setLimitModal] = useState(null)
  const [yeniLimit, setYeniLimit] = useState(3)

  // Personel liste modal state
  const [personnelListModal, setPersonnelListModal] = useState(null)
  const [personeller, setPersoneller] = useState([])

  // Personel ekleme modal (Admin için)
  const [addPersonnelModal, setAddPersonnelModal] = useState(null)
  const [newPersonnel, setNewPersonnel] = useState({ ad: '', soyad: '', email: '', telefon: '', password: '' })

  // Kullanıcı (Patron) şifre değiştirme modal state
  const [userPassModal, setUserPassModal] = useState(null)
  const [newUserPass, setNewUserPass] = useState('')

  // Personel şifre değiştirme modal (Admin için)
  const [personnelPassModal, setPersonnelPassModal] = useState(null)
  const [newPersonnelPass, setNewPersonnelPass] = useState('')

  // Personel düzenleme modal (Admin için)
  const [editPersonnelModal, setEditPersonnelModal] = useState(null)
  const [editPersonnelForm, setEditPersonnelForm] = useState({ ad: '', soyad: '', telefon: '', email: '' })

  // Yeni kullanıcı modal state
  const [createModal, setCreateModal] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '', phone: '' })

  // Tarih modal state
  const [tarihModal, setTarihModal] = useState(null)
  const [yeniTarih, setYeniTarih] = useState('')
  const [tarihAciklama, setTarihAciklama] = useState('')

  // Aktif/Pasif modal state
  const [aktifModal, setAktifModal] = useState(null)
  const [aktifAciklama, setAktifAciklama] = useState('')

  // Log modal state
  const [logModal, setLogModal] = useState(null)

  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Hata ve Onay Modalları
  const [errorModal, setErrorModal] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  useEffect(() => {
    loadKullanicilar()
  }, [])

  // Dışarı tıklanınca dropdown menüyü kapatma işlemi
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const loadKullanicilar = async () => {
    try {
      setLoading(true)
      const res = await api.get('/users')
      setKullanicilar(res.data.kullanicilar)
    } catch (err) {
      setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Kullanıcılar yüklenirken bir hata oluştu.' })
    } finally {
      setLoading(false)
    }
  }

  // ========== AKTIVITE (Tüm kullanıcı logları birleşik) ==========
  const loadAktivite = async () => {
    if (kullanicilar.length === 0) { setAktiviteLoglar([]); return }
    setAktiviteLoading(true)
    try {
      const parcalar = await Promise.all(
        kullanicilar.map(u =>
          api.get(`/users/${u.id}/logs`)
            .then(r => r.data.loglar.map(l => ({ ...l, _patron: u.email })))
            .catch(() => [])
        )
      )
      const hepsi = parcalar.flat().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setAktiviteLoglar(hepsi)
    } catch {
      setErrorModal({ baslik: "Hata", mesaj: "Aktivite kayıtları yüklenirken bir hata oluştu." })
    } finally {
      setAktiviteLoading(false)
    }
  }

  // Görünüm değiştir (mobil sidebar'ı kapat, aktivite ise yükle)
  const gecisYap = (v) => {
    setGorunum(v)
    setSidebarOpen(false)
    if (v === 'aktivite') loadAktivite()
  }

  // ========== AKTIF/PASIF ==========
  const openAktifModal = (u) => {
    if (u.id === kullanici.id && u.aktif) {
      setErrorModal({ baslik: "İşlem Engellendi", mesaj: "Kendi hesabınızı pasif yapamazsınız." })
      return
    }
    setAktifAciklama('')
    setAktifModal({ kullanici: u })
  }

  const saveAktif = async () => {
    try {
      await api.put(`/users/${aktifModal.kullanici.id}/aktif`, {
        aktif: !aktifModal.kullanici.aktif,
        aciklama: aktifAciklama || null
      })
      setAktifModal(null)
      loadKullanicilar()
    } catch (err) {
      setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Aktiflik durumu güncellenemedi.' })
    }
  }

  // ========== TARIH ==========
  const openTarihModal = (u) => {
    setYeniTarih(u.gecerlilik_tarihi ? u.gecerlilik_tarihi.split('T')[0] : '')
    setTarihAciklama('')
    setTarihModal({ kullanici: u })
  }

  const saveTarih = async () => {
    try {
      await api.put(`/users/${tarihModal.kullanici.id}/gecerlilik`, {
        gecerlilik_tarihi: yeniTarih || null,
        aciklama: tarihAciklama || null
      })
      setTarihModal(null)
      loadKullanicilar()
    } catch (err) {
      setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Geçerlilik tarihi güncellenemedi.' })
    }
  }

  // ========== LOG ==========
  const openLogModal = async (u) => {
    try {
      const res = await api.get(`/users/${u.id}/logs`)
      setLogModal({ kullanici: u, loglar: res.data.loglar })
    } catch (err) {
      setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Kullanıcı logları yüklenirken bir hata oluştu.' })
    }
  }

  // ========== PERSONELLERI YUKLE ==========
  const loadPersonnels = async (u) => {
    try {
      const res = await api.get(`/users/${u.id}/personnel`)
      setPersoneller(res.data)
      setPersonnelListModal(u)
    } catch (err) {
      setErrorModal({ baslik: "Hata", mesaj: "Personeller yüklenirken bir hata oluştu." })
    }
  }

  const togglePersonnelStatus = async (p) => {
    try {
      await api.put(`/users/personnel/${p.id}/aktif`)
      loadPersonnels(personnelListModal)
    } catch (err) {
      setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Durum güncellenemedi.' })
    }
  }

  const savePersonnelPassword = async (e) => {
    e.preventDefault()
    if (newPersonnelPass.length < 8) {
      setErrorModal({ baslik: "Hata", mesaj: "Şifre en az 8 karakter olmalıdır." })
      return
    }
    try {
      await api.put(`/users/personnel/${personnelPassModal.id}/password`, { yeni_sifre: newPersonnelPass })
      setPersonnelPassModal(null)
      setNewPersonnelPass('')
      setErrorModal({ baslik: "Başarılı", mesaj: "Personel şifresi güncellendi." })
    } catch (err) {
      setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Şifre güncellenemedi.' })
    }
  }

  // ========== PERSONEL DUZENLE ==========
  const openEditPersonnel = (p) => {
    setEditPersonnelForm({
      ad: p.ad || '',
      soyad: p.soyad || '',
      telefon: p.telefon || '',
      email: p.email || ''
    })
    setEditPersonnelModal(p)
  }

  const saveEditPersonnel = async (e) => {
    e.preventDefault()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editPersonnelForm.email)) {
      setErrorModal({ baslik: "Geçersiz E-posta", mesaj: "Lütfen geçerli bir e-posta adresi girin." })
      return
    }

    const temizTel = editPersonnelForm.telefon.replace(/\D/g, '');
    if (temizTel.length > 0 && temizTel.length < 10) {
      setErrorModal({ baslik: "Geçersiz Telefon", mesaj: "Telefon numarası en az 10 hane olmalıdır." })
      return
    }

    try {
      await api.put(`/users/personnel/${editPersonnelModal.id}`, { ...editPersonnelForm, telefon: temizTel })
      setEditPersonnelModal(null)
      loadPersonnels(personnelListModal)
      loadKullanicilar() // Email vb. güncellendiyse ana listeyi de tazele
    } catch (err) {
      setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Personel güncellenemedi.' })
    }
  }

  // ========== LIMIT GÜNCELLE ==========
  const saveLimit = async () => {
    try {
      await api.put(`/users/${limitModal.id}/limit`, { personnel_limit: parseInt(yeniLimit) })
      setLimitModal(null)
      loadKullanicilar()
    } catch (err) {
      setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Personel limiti güncellenemedi.' })
    }
  }

  // ========== YENI KULLANICI ==========
  const saveNewUser = async (e) => {
    e.preventDefault()

    // Basit bir E-posta geçerlilik kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      setErrorModal({ baslik: "Geçersiz E-posta", mesaj: "Lütfen geçerli bir e-posta adresi girin." })
      return
    }

    const temizTel = newUser.phone.replace(/\D/g, '');
    if (temizTel.length < 10) {
      setErrorModal({ baslik: "Geçersiz Telefon", mesaj: "Telefon numarası en az 10 hane olmalıdır." }) // Validasyon mesajı
      return
    }
    if (newUser.password.length < 8) {
      setErrorModal({ baslik: "Geçersiz Şifre", mesaj: "Şifre en az 8 karakter olmalıdır." }) // Validasyon mesajı
      return
    }
    try {
      await api.post('/users', { ...newUser, phone: temizTel })
      setCreateModal(false)
      setNewUser({ email: '', password: '', phone: '' })
      loadKullanicilar()
    } catch (err) {
      setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Yeni kullanıcı oluşturulamadı.' })
    }
  }

  // ========== KULLANICI SIFRE GUNCELLE (ADMIN) ==========
  const saveUserPassword = async (e) => {
    e.preventDefault()
    if (newUserPass.length < 8) {
      setErrorModal({ baslik: "Hata", mesaj: "Şifre en az 8 karakter olmalıdır." })
      return
    }
    try {
      await api.put(`/users/${userPassModal.id}/password`, { yeni_sifre: newUserPass })
      setUserPassModal(null)
      setNewUserPass('')
      setErrorModal({ baslik: "Başarılı", mesaj: "Kullanıcı şifresi güncellendi." })
    } catch (err) {
      setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Şifre güncellenemedi.' })
    }
  }

  // ========== KULLANICI SİL (ADMIN) ==========
  const silUser = (u) => {
    setConfirmModal({
      baslik: "Kullanıcı Sil",
      mesaj: `${u.email} e-posta adresine sahip kullanıcıyı silmek istediğinize emin misiniz? DİKKAT: Bu işlem kullanıcıya ait tüm müşterileri, siparişleri ve personelleri kalıcı olarak silecektir!`,
      onConfirm: async () => {
        setConfirmModal(null)
        try {
          await api.delete(`/users/${u.id}`)
          loadKullanicilar()
        } catch (err) {
          setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Kullanıcı silinemedi.' })
        }
      }
    })
  }

  // ========== FILTRELEME MANTIGI ==========
  const filtreliKullanicilar = useMemo(() => {
    const aramaLower = (arama || '').toLocaleLowerCase('tr-TR').trim()
    return kullanicilar.filter(u => {
      // 1. Arama Filtresi (Email veya Telefon)
      const email = (u.email || '').toLocaleLowerCase('tr-TR')
      const tel = (u.phone || '').replace(/\D/g, '')
      const aramaTel = aramaLower.replace(/\D/g, '')
      const aramaEslesme = !aramaLower || email.includes(aramaLower) || (aramaTel && tel.includes(aramaTel))

      // 2. Rol Filtresi
      const rolEslesme = rolFiltre === 'hepsi' || u.role === rolFiltre

      // 3. Durum Filtresi (Aktif / Pasif)
      const durumEslesme = durumFiltre === 'hepsi' || (durumFiltre === 'aktif' && u.aktif) || (durumFiltre === 'pasif' && !u.aktif)

      return aramaEslesme && rolEslesme && durumEslesme
    })
  }, [kullanicilar, arama, rolFiltre, durumFiltre])

  // ========== GENEL BAKIŞ İSTATİSTİKLERİ (client-side türetilir) ==========
  const istatistikler = useMemo(() => {
    const toplam = kullanicilar.length
    const aktif = kullanicilar.filter(u => u.aktif).length
    const adminSayisi = kullanicilar.filter(u => u.role === 'admin').length
    const toplamPersonel = kullanicilar.reduce((s, u) => s + (u.personnel_count || 0), 0)
    const toplamLimit = kullanicilar.reduce((s, u) => s + (u.personnel_limit || 0), 0)
    const suresiYaklasan = kullanicilar.filter(u => {
      const t = gecerlilikDurumu(u.gecerlilik_tarihi).tip
      return t === 'doldu' || t === 'yaklasiyor'
    }).length
    return {
      toplam, aktif, pasif: toplam - aktif,
      adminSayisi, patronSayisi: toplam - adminSayisi,
      toplamPersonel, toplamLimit, suresiYaklasan,
      kapasiteYuzde: toplamLimit > 0 ? Math.round((toplamPersonel / toplamLimit) * 100) : 0,
    }
  }, [kullanicilar])

  const sonKullanicilar = useMemo(
    () => [...kullanicilar].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5),
    [kullanicilar]
  )

  // ========== ADMIN PERSONEL EKLE ==========
  const saveAdminPersonnel = async (e) => {
    e.preventDefault()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newPersonnel.email)) {
      setErrorModal({ baslik: "Geçersiz E-posta", mesaj: "Lütfen geçerli bir e-posta adresi girin." })
      return
    }

    const temizTel = newPersonnel.telefon.replace(/\D/g, '');
    if (temizTel.length > 0 && temizTel.length < 10) {
      setErrorModal({ baslik: "Geçersiz Telefon", mesaj: "Telefon numarası en az 10 hane olmalıdır." })
      return
    }

    if (newPersonnel.password.length < 8) {
      setErrorModal({ baslik: "Geçersiz Şifre", mesaj: "Şifre en az 8 karakter olmalıdır." })
      return
    }
    try {
      await api.post(`/users/${addPersonnelModal.id}/personnel`, { ...newPersonnel, telefon: temizTel })
      setAddPersonnelModal(null)
      setNewPersonnel({ ad: '', soyad: '', email: '', telefon: '', password: '' })
      loadPersonnels(addPersonnelModal)
      loadKullanicilar()
    } catch (err) { setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Personel eklenemedi.' }) }
  }

  const basliklar = {
    genel: { h: 'Genel Bakış', p: 'Sistem özeti ve hesap durumu' },
    kullanicilar: { h: 'Kullanıcılar', p: 'Patron hesapları ve personel yönetimi' },
    aktivite: { h: 'Aktivite', p: 'Tüm hesaplardaki son değişiklikler' },
  }
  const aktifBaslik = basliklar[gorunum]
  const adminBasHarf = (kullanici.email || '?').charAt(0).toLocaleUpperCase('tr-TR')

  return (
    <div className="adm-shell">
      {/* Mobil sidebar arka planı */}
      {sidebarOpen && <div className="adm-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ========================= SIDEBAR ========================= */}
      <aside className={`adm-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="adm-brand">
          <span className="adm-brand-mark" aria-hidden="true">H</span>
          <span className="adm-brand-text">
            <b>Halı Yıkama</b>
            <span>Yönetim Paneli</span>
          </span>
        </div>

        <nav className="adm-nav">
          <div className="adm-nav-label">Menü</div>
          <button className={`adm-nav-item ${gorunum === 'genel' ? 'active' : ''}`} onClick={() => gecisYap('genel')}>
            {Icon.genel} Genel Bakış
          </button>
          <button className={`adm-nav-item ${gorunum === 'kullanicilar' ? 'active' : ''}`} onClick={() => gecisYap('kullanicilar')}>
            {Icon.users} Kullanıcılar
            <span className="adm-nav-badge">{kullanicilar.length}</span>
          </button>
          <button className={`adm-nav-item ${gorunum === 'aktivite' ? 'active' : ''}`} onClick={() => gecisYap('aktivite')}>
            {Icon.activity} Aktivite
          </button>
        </nav>

        <div className="adm-sidebar-foot">
          <div className="adm-user-card">
            <span className="adm-user-avatar">{adminBasHarf}</span>
            <span className="adm-user-meta">
              <b title={kullanici.email}>{kullanici.email}</b>
              <span>Yönetici</span>
            </span>
          </div>
        </div>
      </aside>

      {/* ========================= ANA SÜTUN ========================= */}
      <div className="adm-main-col">
        {/* --------- TOPBAR (NAVBAR) --------- */}
        <header className="adm-topbar">
          <button className="adm-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Menüyü aç">
            {Icon.menu}
          </button>
          <div className="adm-topbar-titles">
            <h1>{aktifBaslik.h}</h1>
            <p>{aktifBaslik.p}</p>
          </div>
          <div className="adm-topbar-right">
            <div className="user-menu-container" ref={dropdownRef}>
              <button className={`adm-usermenu-trigger ${dropdownOpen ? 'open' : ''}`} onClick={() => setDropdownOpen(!dropdownOpen)}>
                <span className="adm-usermenu-avatar">{adminBasHarf}</span>
                <span className="adm-usermenu-info">
                  <b title={kullanici.email}>{kullanici.email}</b>
                  <span>Yönetici</span>
                </span>
                <span className="adm-usermenu-chevron">{Icon.chevron}</span>
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu adm-dropdown" onClick={() => setDropdownOpen(false)}>
                  <div className="adm-dropdown-head">
                    <span className="adm-usermenu-avatar lg">{adminBasHarf}</span>
                    <div className="adm-dropdown-head-meta">
                      <b title={kullanici.email}>{kullanici.email}</b>
                      <span>Yönetici hesabı</span>
                    </div>
                  </div>
                  <div className="adm-dropdown-sep" />
                  <button className="dropdown-item" onClick={() => setPasswordModalOpen(true)}>
                    <span className="adm-dropdown-ico">{Icon.key}</span>
                    Şifre Değiştir
                  </button>
                  <button className="dropdown-item logout-red" onClick={logout}>
                    <span className="adm-dropdown-ico">{Icon.logout}</span>
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* --------- İÇERİK --------- */}
        <main className="adm-content">

          {/* ===== GÖRÜNÜM: GENEL BAKIŞ ===== */}
          {gorunum === 'genel' && (
            <>
              <div className="adm-stat-grid">
                <div className="adm-stat-card featured">
                  <span className="adm-stat-icon">{Icon.users}</span>
                  <span className="adm-stat-label">Toplam Kullanıcı</span>
                  <span className="adm-stat-value">{istatistikler.toplam}</span>
                  <span className="adm-stat-sub">{istatistikler.patronSayisi} patron · {istatistikler.adminSayisi} admin</span>
                </div>
                <div className="adm-stat-card">
                  <span className="adm-stat-icon notr">{Icon.genel}</span>
                  <span className="adm-stat-label">Aktif Hesap</span>
                  <span className="adm-stat-value">{istatistikler.aktif}</span>
                  <span className="adm-stat-sub">{istatistikler.pasif} pasif hesap</span>
                </div>
                <div className="adm-stat-card">
                  <span className="adm-stat-icon koyu">{Icon.team}</span>
                  <span className="adm-stat-label">Toplam Personel</span>
                  <span className="adm-stat-value">{istatistikler.toplamPersonel}</span>
                  <span className="adm-stat-sub">{istatistikler.toplamLimit} kişilik kapasite</span>
                </div>
                <div className={`adm-stat-card ${istatistikler.suresiYaklasan > 0 ? 'uyari' : ''}`}>
                  <span className="adm-stat-icon kirmizi">{Icon.alert}</span>
                  <span className="adm-stat-label">Süre Uyarısı</span>
                  <span className="adm-stat-value">{istatistikler.suresiYaklasan}</span>
                  <span className="adm-stat-sub">dolan / {GECERLILIK_UYARI_GUN} güne yaklaşan</span>
                </div>
              </div>

              <div className="adm-overview-cols">
                {/* Kapasite kullanımı */}
                <section className="adm-panel">
                  <div className="adm-panel-head">
                    <h3>Personel Kapasitesi</h3>
                    <button className="adm-link" onClick={() => gecisYap('kullanicilar')}>Kullanıcılara git →</button>
                  </div>
                  <div className="adm-cap-overall">
                    <div className="adm-cap-overall-top">
                      <span>Genel doluluk</span>
                      <strong>%{istatistikler.kapasiteYuzde}</strong>
                    </div>
                    <div className="adm-cap-bar">
                      <div className="adm-cap-fill" style={{ width: `${Math.min(istatistikler.kapasiteYuzde, 100)}%` }} />
                    </div>
                    <div className="adm-cap-overall-sub">{istatistikler.toplamPersonel} / {istatistikler.toplamLimit} personel</div>
                  </div>

                  <div className="adm-cap-list">
                    {kullanicilar.filter(u => u.role !== 'admin').length === 0 ? (
                      <p className="empty" style={{ padding: 20 }}>Henüz patron hesabı yok.</p>
                    ) : (
                      kullanicilar.filter(u => u.role !== 'admin').map(u => {
                        const limit = u.personnel_limit || 0
                        const yuzde = limit > 0 ? Math.round((u.personnel_count / limit) * 100) : 0
                        const dolu = limit > 0 && u.personnel_count >= limit
                        return (
                          <div className="adm-cap-row" key={u.id}>
                            <div className="adm-cap-row-head">
                              <span className="adm-cap-mail" title={u.email}>{u.email}</span>
                              <span className={`adm-cap-num ${dolu ? 'dolu' : ''}`}>{u.personnel_count}/{limit}</span>
                            </div>
                            <div className="adm-cap-bar sm">
                              <div className={`adm-cap-fill ${dolu ? 'dolu' : ''}`} style={{ width: `${Math.min(yuzde, 100)}%` }} />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </section>

                {/* Son eklenen kullanıcılar */}
                <section className="adm-panel">
                  <div className="adm-panel-head">
                    <h3>Son Eklenen Kullanıcılar</h3>
                  </div>
                  {sonKullanicilar.length === 0 ? (
                    <p className="empty" style={{ padding: 20 }}>Kayıt yok.</p>
                  ) : (
                    <div className="adm-recent-list">
                      {sonKullanicilar.map(u => (
                        <div className="adm-recent-row" key={u.id}>
                          <span className="adm-recent-avatar">{(u.email || '?').charAt(0).toLocaleUpperCase('tr-TR')}</span>
                          <div className="adm-recent-meta">
                            <b title={u.email}>{u.email}</b>
                            <span>{formatTarih(u.created_at)}</span>
                          </div>
                          <span className={`status-toggle ${u.aktif ? 'aktif' : 'pasif'}`} style={{ cursor: 'default' }}>
                            {u.aktif ? '● Aktif' : '○ Pasif'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </>
          )}

          {/* ===== GÖRÜNÜM: KULLANICILAR ===== */}
          {gorunum === 'kullanicilar' && (
            <section className="card">
              <div className="card-header">
                <h2>Kullanıcılar ({filtreliKullanicilar.length}{arama || rolFiltre !== 'hepsi' || durumFiltre !== 'hepsi' ? `/${kullanicilar.length}` : ''})</h2>
                <button className="btn-primary" onClick={() => setCreateModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
                  Yeni Kullanıcı
                </button>
              </div>

              {/* FİLTRELEME BARI */}
              <div className="filter-row" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="search-bar" style={{ flex: '1 1 250px', marginBottom: 0 }}>
                  <input
                    type="text"
                    placeholder="E-posta veya telefon ile ara..."
                    value={arama}
                    onChange={(e) => setArama(e.target.value)}
                    style={{ padding: '10px 16px', width: '100%' }}
                  />
                  {arama && <button className="search-clear" onClick={() => setArama('')}>✕</button>}
                </div>
                <select
                  value={rolFiltre}
                  onChange={(e) => setRolFiltre(e.target.value)}
                  className="durum-filtre"
                  style={{ flex: '1 1 150px', padding: '0 12px', height: '40px' }}
                >
                  <option value="hepsi">Tüm Roller</option>
                  <option value="admin">Admin</option>
                  <option value="user">Kullanıcı (Patron)</option>
                </select>
                <select
                  value={durumFiltre}
                  onChange={(e) => setDurumFiltre(e.target.value)}
                  className="durum-filtre"
                  style={{ flex: '1 1 150px', padding: '0 12px', height: '40px' }}
                >
                  <option value="hepsi">Tüm Durumlar</option>
                  <option value="aktif">Aktif Hesaplar</option>
                  <option value="pasif">Pasif Hesaplar</option>
                </select>
                {(arama || rolFiltre !== 'hepsi' || durumFiltre !== 'hepsi') && (
                  <button className="btn-secondary" onClick={() => { setArama(''); setRolFiltre('hepsi'); setDurumFiltre('hepsi'); }} style={{ height: '40px', padding: '0 16px' }}>Temizle</button>
                )}
              </div>

              {loading ? (
                <p className="empty">Yükleniyor...</p>
              ) : filtreliKullanicilar.length === 0 ? (
                <p className="empty">Arama kriterlerine uygun kullanıcı bulunamadı.</p>
              ) : (
                <div className="ent-grid">
                  {filtreliKullanicilar.map(u => {
                    const gd = gecerlilikDurumu(u.gecerlilik_tarihi)
                    const limit = u.personnel_limit || 0
                    const dolu = u.personnel_count || 0
                    const yuzde = limit > 0 ? Math.min((dolu / limit) * 100, 100) : 0
                    return (
                      <div
                        key={u.id}
                        className={`ent-card ${gd.tip === 'doldu' ? 'is-alert' : ''} ${!u.aktif ? 'is-muted' : ''}`}
                      >
                        <div className="ent-head">
                          <span className="ent-avatar">{(u.email || '?').charAt(0).toLocaleUpperCase('tr-TR')}</span>
                          <div className="ent-head-text">
                            <div className="ent-name" title={u.email}>{u.email}</div>
                            <span className={`badge badge-${u.role}`} style={{ marginTop: 4 }}>
                              {u.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                            </span>
                          </div>
                          <span className="ent-status">
                            <button
                              className={`status-toggle ${u.aktif ? 'aktif' : 'pasif'}`}
                              onClick={() => openAktifModal(u)}
                              title="Hesap durumunu değiştir"
                            >
                              {u.aktif ? '● Aktif' : '○ Pasif'}
                            </button>
                          </span>
                        </div>

                        <div className="ent-body">
                          <div className="ent-row">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                            <span className="ent-ellipsis" style={{ color: 'var(--color-text)' }}>{formatTelefon(u.phone) || '—'}</span>
                          </div>

                          <div
                            className={`ent-cap ${limit > 0 && dolu >= limit ? 'is-full' : ''}`}
                            onClick={() => loadPersonnels(u)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); loadPersonnels(u) } }}
                            title="Personelleri gör ve yönet"
                          >
                            <div className="ent-cap-top">
                              <span className="ent-meta-label">Personel</span>
                              <b>{dolu} / {limit}</b>
                            </div>
                            <div className="ent-cap-bar"><div className="ent-cap-fill" style={{ width: `${yuzde}%` }} /></div>
                          </div>

                          <div className="ent-meta">
                            <span className="ent-meta-label">Geçerlilik</span>
                            <div className="adm-gecerlilik" style={{ alignItems: 'flex-end' }}>
                              <span className="ent-meta-val">{formatTarih(u.gecerlilik_tarihi)}</span>
                              <span className={`adm-gecerlilik-tag tag-${gd.tip}`}>{gd.etiket}</span>
                            </div>
                          </div>
                        </div>

                        <div className="ent-foot">
                          <button className="ent-ico-btn" onClick={() => { setLimitModal(u); setYeniLimit(u.personnel_limit); }} title="Personel limitini düzenle" aria-label="Personel limitini düzenle">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                          </button>
                          <button className="ent-ico-btn" onClick={() => openTarihModal(u)} title="Geçerlilik tarihini düzenle" aria-label="Geçerlilik tarihini düzenle">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          </button>
                          <button className="ent-ico-btn" onClick={() => openLogModal(u)} title="İşlem geçmişini gör" aria-label="İşlem geçmişini gör">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          </button>
                          <button className="ent-ico-btn" onClick={() => setUserPassModal(u)} title="Şifre değiştir" aria-label="Şifre değiştir">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                          </button>
                          <span className="ent-foot-spacer" />
                          <span className="ent-foot-sep" />
                          <button className="ent-ico-btn danger" onClick={() => silUser(u)} title="Hesabı sil" aria-label="Hesabı sil">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* ===== GÖRÜNÜM: AKTIVITE ===== */}
          {gorunum === 'aktivite' && (
            <section className="card">
              <div className="card-header">
                <h2>Aktivite Akışı {aktiviteLoglar.length > 0 && `(${aktiviteLoglar.length})`}</h2>
                <button className="btn-secondary" onClick={loadAktivite} disabled={aktiviteLoading}>
                  {aktiviteLoading ? 'Yükleniyor...' : 'Yenile'}
                </button>
              </div>

              {aktiviteLoading ? (
                <p className="empty">Aktivite kayıtları yükleniyor...</p>
              ) : aktiviteLoglar.length === 0 ? (
                <p className="empty">Henüz aktivite kaydı yok.</p>
              ) : (
                <div className="adm-feed">
                  {aktiviteLoglar.map(log => (
                    <div className="adm-feed-item" key={`${log._patron}-${log.id}`}>
                      <span className="adm-feed-icon">{Icon.clock}</span>
                      <div className="adm-feed-body">
                        <div className="adm-feed-top">
                          <span className="adm-feed-title">{(log.islem || '').replace(/_/g, ' ')}</span>
                          <span className="adm-feed-time">{new Date(log.created_at).toLocaleString('tr-TR')}</span>
                        </div>
                        {(log.eski_deger || log.yeni_deger) && (
                          <div className="adm-feed-change">
                            <span className="log-eski">{log.eski_deger || '—'}</span>
                            <span className="log-arrow">→</span>
                            <span className="log-yeni">{log.yeni_deger || '—'}</span>
                          </div>
                        )}
                        <div className="adm-feed-meta">
                          <span className="adm-feed-chip">{log._patron}</span>
                          {log.aciklama ? log.aciklama : <>İşlemi yapan: <strong>{log.changed_by_email}</strong></>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>

        {/* --------- FOOTER --------- */}
        <footer className="adm-footer">
          <p>© {new Date().getFullYear()} Halı Yıkama Uygulaması — Yönetim Paneli</p>
          <p>Destek: <a href="mailto:hali.temizleme@protonmail.com">hali.temizleme@protonmail.com</a></p>
        </footer>
      </div>

      {/* ============================================================
          MODALLAR
          ============================================================ */}

      {/* YENI KULLANICI MODAL */}
      {createModal && (
        <Modal title="Yeni Kullanıcı Ekle" subtitle="Yeni bir patron hesabı oluşturun." icon="info" onClose={() => setCreateModal(false)}>
            <form onSubmit={saveNewUser}>
              <label>E-posta</label>
              <input
                type="email"
                required
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="ornek@hali.com"
              />
              <label style={{ marginTop: 12 }}>Telefon</label>
              <input
                type="tel"
                required
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: formatPhoneInput(e.target.value) })}
                placeholder="0 5XX XXX XX XX"
              />
              <label style={{ marginTop: 12 }}>Şifre</label>
              <input
                type="password"
                required
                minLength={8}
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="En az 8 karakter"
              />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setCreateModal(false)}>İptal</button>
                <button type="submit" className="btn-primary">Kullanıcıyı Oluştur</button>
              </div>
            </form>
        </Modal>
      )}

      {/* LIMIT GUNCELLE MODAL */}
      {limitModal && (
        <Modal title="Personel Limiti Güncelle" subtitle={limitModal.email} onClose={() => setLimitModal(null)}>
            <label>Yeni Limit (Default: 3)</label>
            <input
              type="number"
              min="0" // Limit 0 veya daha büyük olabilir
              value={yeniLimit}
              onChange={(e) => setYeniLimit(e.target.value)}
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setLimitModal(null)}>İptal</button>
              <button className="btn-primary" onClick={saveLimit}>Güncelle</button>
            </div>
        </Modal>
      )}

      {/* KULLANICI SIFRE MODAL (ADMIN ICIN) */}
      {userPassModal && (
        <Modal title="Şifre Değiştir" subtitle={`${userPassModal.email} için yeni şifre.`} icon="lock" onClose={() => setUserPassModal(null)}>
            <form onSubmit={saveUserPassword}>
              <label>Yeni Şifre</label>
              <input type="password" required minLength={8} value={newUserPass} onChange={e => setNewUserPass(e.target.value)} autoFocus />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setUserPassModal(null)}>İptal</button>
                <button type="submit" className="btn-primary">Şifreyi Güncelle</button>
              </div>
            </form>
        </Modal>
      )}

      {/* PERSONEL LISTE MODAL (ADMIN ICIN) */}
      {personnelListModal && (
        <Modal title={`${personnelListModal.email} — Personelleri`} subtitle="Bu kullanıcının personellerini yönetin." size="wide" onClose={() => setPersonnelListModal(null)}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button className="btn-modern-action add" onClick={() => setAddPersonnelModal(personnelListModal)}>
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
                Personel Ekle
              </button>
            </div>
            <div className="table-wrap" style={{ marginTop: 15 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ad Soyad</th>
                    <th>Telefon</th>
                    <th>Durum</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {personeller.map(p => (
                    <tr key={p.id}>
                      <td>{p.ad} {p.soyad}</td> {/* Ad Soyad */}
                      <td>
                        <div>{p.email}</div> {/* Email */}
                        <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>{formatTelefon(p.telefon)}</div> {/* Telefon */}
                      </td>
                      <td>{p.aktif ? 'Aktif' : 'Pasif'}</td>
                      <td className="actions actions-cell"> {/* İşlemler */}
                        <button className="btn-modern-action history" onClick={() => openEditPersonnel(p)}>
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          Düzenle
                        </button>
                        <button className="btn-modern-action password" onClick={() => setPersonnelPassModal(p)}>
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                          Şifre
                        </button>
                        <button className={`btn-modern-action ${p.aktif ? 'toggle-pasif' : 'toggle-aktif'}`} onClick={() => togglePersonnelStatus(p)}>
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                          {p.aktif ? 'Pasif Yap' : 'Aktif Yap'}
                        </button>
                        <button className="btn-modern-action del" onClick={() => setConfirmModal({
                          baslik: "Personel Sil",
                          mesaj: `${p.ad} ${p.soyad} adlı personeli silmek istediğinize emin misiniz?`,
                          onConfirm: async () => {
                            setConfirmModal(null); // İşlem başlamadan kapat ki UI donmasın
                            try {
                              await api.delete(`/users/personnel/${p.id}`);
                              loadPersonnels(personnelListModal);
                              loadKullanicilar(); // Limit bilgisini güncellemek için
                            } catch (err) {
                              setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || "Personel silinemedi." });
                            }
                          }
                        })}>
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                  {personeller.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: 20 }}>Personel bulunamadı</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setPersonnelListModal(null)}>Kapat</button>
            </div>
        </Modal>
      )}

      {/* PERSONEL EKLEME MODAL (ADMIN ICIN) */}
      {addPersonnelModal && (
        <Modal title="Personel Ekle" subtitle={`${addPersonnelModal.email} kullanıcısına personel atanıyor.`} icon="info" onClose={() => setAddPersonnelModal(null)}>
            <form onSubmit={saveAdminPersonnel}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label>Ad</label>
                  <input type="text" required value={newPersonnel.ad} onChange={e => setNewPersonnel({ ...newPersonnel, ad: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Soyad</label>
                  <input type="text" required value={newPersonnel.soyad} onChange={e => setNewPersonnel({ ...newPersonnel, soyad: e.target.value })} />
                </div>
              </div>
              <label style={{ marginTop: 10 }}>E-posta</label>
              <input type="email" required value={newPersonnel.email} onChange={e => setNewPersonnel({ ...newPersonnel, email: e.target.value })} />

              <label style={{ marginTop: 10 }}>Telefon</label>
              <input type="tel" value={newPersonnel.telefon} onChange={e => setNewPersonnel({ ...newPersonnel, telefon: formatPhoneInput(e.target.value) })} placeholder="0 5XX XXX XX XX" />

              <label style={{ marginTop: 10 }}>Şifre</label>
              <input type="password" required minLength={8} value={newPersonnel.password} onChange={e => setNewPersonnel({ ...newPersonnel, password: e.target.value })} />

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setAddPersonnelModal(null)}>İptal</button>
                <button type="submit" className="btn-primary">Ekle</button>
              </div>
            </form>
        </Modal>
      )}

      {/* PERSONEL DUZENLE MODAL (ADMIN ICIN) */}
      {editPersonnelModal && (
        <Modal title="Personel Düzenle" subtitle={`${editPersonnelModal.email} bilgilerini güncelliyorsunuz.`} onClose={() => setEditPersonnelModal(null)}>
            <form onSubmit={saveEditPersonnel}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label>Ad</label>
                  <input type="text" required value={editPersonnelForm.ad} onChange={e => setEditPersonnelForm({ ...editPersonnelForm, ad: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Soyad</label>
                  <input type="text" required value={editPersonnelForm.soyad} onChange={e => setEditPersonnelForm({ ...editPersonnelForm, soyad: e.target.value })} />
                </div>
              </div>
              <label style={{ marginTop: 10 }}>E-posta</label>
              <input type="email" required value={editPersonnelForm.email} onChange={e => setEditPersonnelForm({ ...editPersonnelForm, email: e.target.value })} />

              <label style={{ marginTop: 10 }}>Telefon</label>
              <input type="tel" value={editPersonnelForm.telefon} onChange={e => setEditPersonnelForm({ ...editPersonnelForm, telefon: formatPhoneInput(e.target.value) })} placeholder="0 5XX XXX XX XX" />

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setEditPersonnelModal(null)}>İptal</button>
                <button type="submit" className="btn-primary">Güncelle</button>
              </div>
            </form>
        </Modal>
      )}

      {/* PERSONEL SIFRE MODAL (ADMIN) */}
      {personnelPassModal && (
        <Modal title="Şifre Değiştir" subtitle={`${personnelPassModal.ad} ${personnelPassModal.soyad} için yeni şifre.`} icon="lock" onClose={() => setPersonnelPassModal(null)}>
            <form onSubmit={savePersonnelPassword}>
              <label>Yeni Şifre</label>
              <input type="password" required minLength={8} value={newPersonnelPass} onChange={e => setNewPersonnelPass(e.target.value)} autoFocus />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setPersonnelPassModal(null)}>İptal</button>
                <button type="submit" className="btn-primary">Şifreyi Güncelle</button>
              </div>
            </form>
        </Modal>
      )}

      {/* AKTIF/PASIF MODAL */}
      {aktifModal && (
        <Modal
          title={aktifModal.kullanici.aktif ? 'Hesabı Pasif Yap' : 'Hesabı Aktif Yap'}
          subtitle={aktifModal.kullanici.email}
          icon={aktifModal.kullanici.aktif ? 'warning' : 'info'}
          onClose={() => setAktifModal(null)}
        >
            <div className="modal-info">
              <div className="modal-info-row">
                <span className="info-label">Mevcut durum:</span>
                <span className={`status-toggle ${aktifModal.kullanici.aktif ? 'aktif' : 'pasif'}`}>
                  {aktifModal.kullanici.aktif ? '● Aktif' : '○ Pasif'}
                </span>
              </div>
              <div className="modal-info-row">
                <span className="info-label">Yeni durum:</span>
                <span className={`status-toggle ${!aktifModal.kullanici.aktif ? 'aktif' : 'pasif'}`}>
                  {!aktifModal.kullanici.aktif ? '● Aktif' : '○ Pasif'}
                </span>
              </div>
            </div>

            <label style={{ marginTop: 16 }}>Açıklama (opsiyonel)</label>
            <textarea
              rows={3}
              value={aktifAciklama}
              onChange={(e) => setAktifAciklama(e.target.value)}
              placeholder={
                aktifModal.kullanici.aktif
                  ? 'Örn: Ödemesini yapmadı, abonelik bitti...'
                  : 'Örn: Ödeme alındı, tekrar aktifleştirildi...'
              }
            />

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setAktifModal(null)}>
                İptal
              </button>
              <button className="btn-primary" onClick={saveAktif}>
                Onayla
              </button>
            </div>
        </Modal>
      )}

      {/* TARIH MODAL */}
      {tarihModal && (
        <Modal title="Geçerlilik Tarihi" subtitle={tarihModal.kullanici.email} onClose={() => setTarihModal(null)}>
            <label>Yeni geçerlilik tarihi (boş = sınırsız)</label>
            <input
              type="date"
              value={yeniTarih}
              onChange={(e) => setYeniTarih(e.target.value)}
            />

            <label style={{ marginTop: 14 }}>Açıklama (opsiyonel)</label>
            <textarea
              rows={3}
              value={tarihAciklama}
              onChange={(e) => setTarihAciklama(e.target.value)}
              placeholder="Örn: Yıllık abonelik yenilendi"
            />

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setTarihModal(null)}>
                İptal
              </button>
              <button className="btn-primary" onClick={saveTarih}>
                Kaydet
              </button>
            </div>
        </Modal>
      )}

      {/* LOG MODAL */}
      {logModal && (
        <Modal title="Değişiklik Geçmişi" subtitle={logModal.kullanici.email} size="wide" onClose={() => setLogModal(null)}>
            {logModal.loglar.length === 0 ? (
              <p className="empty">Henüz değişiklik yok.</p>
            ) : (
              <div className="log-list">
                {logModal.loglar.map(log => (
                  <div key={log.id} className="log-item">
                    <div className="log-head">
                      <strong>{log.islem.replace('_', ' ')}</strong>
                      <span className="log-time">{new Date(log.created_at).toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="log-body">
                      <span className="log-eski">{log.eski_deger || '—'}</span>
                      <span className="log-arrow">→</span>
                      <span className="log-yeni">{log.yeni_deger || '—'}</span>
                    </div>
                    <div className="log-meta">
                      {log.aciklama ? log.aciklama : <>Hesap Sahibi: <strong>{log.changed_by_email}</strong></>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setLogModal(null)}>
                Kapat
              </button>
            </div>
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

      {passwordModalOpen && (
        <PasswordModal onClose={() => setPasswordModalOpen(false)} />
      )}
    </div>
  )
}
