import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import CustomersTab from '../components/CustomersTab'
import OrdersTab from '../components/OrdersTab'
import PasswordModal from '../components/PasswordModal'
import CarpetTypesTab from '../components/CarpetTypesTab' // Yeni
// PersonnelTab bileşenini import et
import PersonnelTab from '../components/PersonnelTab'
import ExpensesTab from '../components/ExpensesTab'
import DashboardTab from '../components/DashboardTab'
import './AdminDashboard.css' // ortak modern kabuk (.adm-*) + bileşen stilleri
import './UserDashboard.css'

/* Tek tutarlı stroke SVG ikon ailesi — emoji yok */
const Icon = {
  chart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  box: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  tag: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  briefcase: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  menu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  key: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  chevron: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  wallet: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
}

const BASLIKLAR = {
  dashboard: { h: 'Genel Bakış', p: 'İşletmenizin özeti ve grafikleri' },
  customers: { h: 'Müşteriler', p: 'Müşteri kayıtları ve iletişim' },
  orders: { h: 'Siparişler', p: 'Sipariş takibi ve durum yönetimi' },
  expenses: { h: 'Harcamalar', p: 'İşletme giderleri ve ödeme takibi' },
  carpet_types: { h: 'Halı Tipleri', p: 'Fiyatlandırma ve m² hesabı' },
  personnel: { h: 'Personellerim', p: 'Personel hesapları ve yetkiler' },
}

export default function UserDashboard() {
  const { kullanici, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const isPersonel = kullanici.role === 'personnel'

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

  // Abonelik süresini hesaplayan fonksiyon
  const getSubscriptionStatus = () => {
    if (!kullanici || kullanici.role === 'personnel') return null;
    if (!kullanici.gecerlilik_tarihi) return { text: 'Sınırsız Lisans', colorClass: 'sub-unlimited' };

    const bitis = new Date(kullanici.gecerlilik_tarihi);
    const bugun = new Date();
    const diffDays = Math.ceil((bitis - bugun) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Süresi Doldu', colorClass: 'sub-expired' };
    if (diffDays <= 3) return { text: `Son ${diffDays} Gün`, colorClass: 'sub-critical' };
    if (diffDays <= 7) return { text: `Kalan: ${diffDays} Gün`, colorClass: 'sub-warning' };
    return { text: `Lisans: ${diffDays} Gün`, colorClass: 'sub-active' };
  };

  const subStatus = getSubscriptionStatus();

  // Rol kısıtlı sidebar menüsü
  const navItems = [
    { id: 'dashboard', label: 'Genel Bakış', icon: Icon.chart },
    { id: 'customers', label: 'Müşteriler', icon: Icon.users },
    { id: 'orders', label: 'Siparişler', icon: Icon.box },
    ...(!isPersonel ? [
      { id: 'expenses', label: 'Harcamalar', icon: Icon.wallet },
      { id: 'carpet_types', label: 'Halı Tipleri', icon: Icon.tag },
      { id: 'personnel', label: 'Personellerim', icon: Icon.briefcase },
    ] : []),
  ]

  const gecisYap = (id) => {
    setActiveTab(id)
    setSidebarOpen(false)
  }

  const aktifBaslik = BASLIKLAR[activeTab]
  const basHarf = (kullanici.email || '?').charAt(0).toLocaleUpperCase('tr-TR')
  const rolEtiket = isPersonel ? 'Personel' : 'İşletme Sahibi'

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
            <span>İşletme Paneli</span>
          </span>
        </div>

        <nav className="adm-nav">
          <div className="adm-nav-label">Menü</div>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`adm-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => gecisYap(item.id)}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <div className="adm-sidebar-foot">
          {subStatus && (
            <div className={`subscription-badge ${subStatus.colorClass} adm-sub-sidebar`} title={kullanici.gecerlilik_tarihi ? new Date(kullanici.gecerlilik_tarihi).toLocaleDateString('tr-TR') : 'Sınırsız'}>
              {Icon.clock}
              {subStatus.text}
            </div>
          )}
          <div className="adm-user-card">
            <span className="adm-user-avatar">{basHarf}</span>
            <span className="adm-user-meta">
              <b title={kullanici.email}>{kullanici.email}</b>
              <span>{rolEtiket}</span>
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
            {subStatus && (
              <div className={`subscription-badge ${subStatus.colorClass} adm-sub-topbar`} title={kullanici.gecerlilik_tarihi ? new Date(kullanici.gecerlilik_tarihi).toLocaleDateString('tr-TR') : 'Sınırsız'}>
                {Icon.clock}
                {subStatus.text}
              </div>
            )}
            <div className="user-menu-container" ref={dropdownRef}>
              <button className={`adm-usermenu-trigger ${dropdownOpen ? 'open' : ''}`} onClick={() => setDropdownOpen(!dropdownOpen)}>
                <span className="adm-usermenu-avatar">{basHarf}</span>
                <span className="adm-usermenu-info">
                  <b title={kullanici.email}>{kullanici.email}</b>
                  <span>{rolEtiket}</span>
                </span>
                <span className="adm-usermenu-chevron">{Icon.chevron}</span>
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu adm-dropdown" onClick={() => setDropdownOpen(false)}>
                  <div className="adm-dropdown-head">
                    <span className="adm-usermenu-avatar lg">{basHarf}</span>
                    <div className="adm-dropdown-head-meta">
                      <b title={kullanici.email}>{kullanici.email}</b>
                      <span>{rolEtiket}</span>
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
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'customers' && <CustomersTab />}
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'expenses' && !isPersonel && <ExpensesTab />}
          {activeTab === 'carpet_types' && !isPersonel && <CarpetTypesTab />}
          {activeTab === 'personnel' && !isPersonel && <PersonnelTab />}
        </main>

        {/* --------- FOOTER --------- */}
        <footer className="adm-footer">
          <p>© {new Date().getFullYear()} Halı Yıkama Uygulaması — İşletme Paneli</p>
          <p>Destek: <a href="mailto:hali.temizleme@protonmail.com">hali.temizleme@protonmail.com</a></p>
        </footer>
      </div>

      {passwordModalOpen && (
        <PasswordModal onClose={() => setPasswordModalOpen(false)} />
      )}
    </div>
  )
}
