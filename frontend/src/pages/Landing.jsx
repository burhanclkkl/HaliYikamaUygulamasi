import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Footer from '../components/Footer';
import './Landing.css';

/* Tek tutarlı stroke SVG ikon ailesi (lucide tarzı) — emoji yok */
const ico = {
  check: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="20 6 9 17 4 12" /></svg>),
  circle: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" {...p}><circle cx="12" cy="12" r="8" /></svg>),
  refresh: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>),
  file: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>),
  phone: (p) => (<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>),
  mapPin: (p) => (<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>),
  message: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>),
  sparkles: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...p}><path d="M12 2.5l1.8 5.2 5.2 1.8-5.2 1.8L12 16.5l-1.8-5.2L5 9.5l5.2-1.8z" /><path d="M19 14l.8 2.2 2.2.8-2.2.8L19 20l-.8-2.2-2.2-.8 2.2-.8z" /></svg>),
  arrowRight: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>),
  chart: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>),
  users: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>),
  // yaşam döngüsü ikonları
  box: (p) => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>),
  droplet: (p) => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>),
  wind: (p) => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" /></svg>),
  package: (p) => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>),
  truck: (p) => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>),
};

const STEPS = [
  { id: 1, title: '1. Sipariş & Ölçüm', desc: 'Müşteriden alınan halıların tipi ve ölçüleri girilir, tutar otomatik hesaplanır.' },
  { id: 2, title: '2. Yıkama Aşamaları', desc: 'Halılar temizlik aşamalarından geçerken sistemden tek tıkla durumları güncellenir.' },
  { id: 3, title: '3. Anında Bildirim', desc: 'Aşama değiştikçe müşteriye WhatsApp üzerinden profesyonel şablonlar ve PDF irsaliye iletilir.' },
  { id: 4, title: '4. Teslimat & Ödeme', desc: 'Halılar teslim edilir, Nakit/Kart ödemesi alınarak sipariş başarıyla tamamlanır.' },
];

const LIFECYCLE = [
  { label: 'Teslim Alındı', Icon: ico.box, state: 'done' },
  { label: 'Yıkanıyor', Icon: ico.droplet, state: 'active' },
  { label: 'Kurulanıyor', Icon: ico.wind, state: '' },
  { label: 'Paketlendi', Icon: ico.package, state: '' },
  { label: 'Teslimata Çıktı', Icon: ico.truck, state: '' },
  { label: 'Teslim Edildi', Icon: ico.check, state: '' },
];

const EASE = [0.22, 1, 0.36, 1];

function useV() {
  const reduce = useReducedMotion();
  if (reduce) {
    const vis = { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } };
    return { container: { hidden: {}, show: {} }, item: vis, fade: vis };
  }
  return {
    container: { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } },
    item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } },
    fade: { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } },
  };
}

/* Görünüme girince yumuşak yukarı-açılma; içerik bir kez açılır */
function Reveal({ children, className }) {
  const { fade } = useV();
  return (
    <motion.div className={className} variants={fade} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const [activeStep, setActiveStep] = useState(1);
  const V = useV();
  const reduce = useReducedMotion();

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches) return; // hareketi azalt: otomatik döngü yok
    const timer = setInterval(() => setActiveStep((prev) => (prev % 4) + 1), 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="landing-page haliyikama-theme">
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-mark" aria-hidden="true">H</span>
            <span className="logo-text"><b>Halı Yıkama</b> <span>Uygulaması</span></span>
          </div>
          <div className="nav-links">
            <a href="#nasil-calisir" className="nav-link">Nasıl çalışır</a>
            <a href="#ozellikler" className="nav-link">Özellikler</a>
            <a href="mailto:hali.temizleme@protonmail.com" className="nav-link">İletişim</a>
          </div>
          <div className="nav-actions">
            <Link to="/login" className="nav-btn-outline">Giriş Yap</Link>
          </div>
        </div>
      </nav>

      <main className="landing-main-content">
        {/* HERO — asimetrik komuta paneli */}
        <section className="hero-section">
          <div className="hero-inner">
            <motion.div className="hero-copy" variants={V.container} initial="hidden" animate="show">
              <motion.h1 className="hero-headline" variants={V.item}>
                Halı yıkama işletmenizi tek ekrandan yönetin.
              </motion.h1>
              <motion.p className="hero-subheadline" variants={V.item}>
                Sipariş, ölçüm, durum takibi, WhatsApp bildirimi ve tahsilat. Hepsi tek panoda, her zaman net.
              </motion.p>
              <motion.div className="hero-cta-group" variants={V.item}>
                <a href="mailto:hali.temizleme@protonmail.com" className="cta-primary-large">
                  İletişime geçin <ico.arrowRight />
                </a>
                <Link to="/login" className="cta-secondary-large">Giriş yap</Link>
              </motion.div>
              <motion.ul className="hero-trust" variants={V.item}>
                <li><ico.check /> m² otomatik hesap</li>
                <li><ico.check /> WhatsApp bildirimi</li>
                <li><ico.check /> PDF irsaliye</li>
                <li><ico.check /> Tahsilat takibi</li>
              </motion.ul>
            </motion.div>

            <motion.div
              className="hero-visual"
              initial={reduce ? false : { opacity: 0, y: 28, rotate: -4 }}
              animate={reduce ? { rotate: -1.5 } : { opacity: 1, y: 0, rotate: -1.5 }}
              transition={reduce ? { duration: 0 } : { duration: 0.7, ease: EASE, delay: 0.15 }}
            >
              <div className="hero-order-card">
                <div className="hoc-head">
                  <span className="hoc-id">#1042 <small>· IRS-1042</small></span>
                  <span className="hoc-badge">Yıkanıyor</span>
                </div>
                <div className="hoc-customer">
                  <strong>Ahmet Yılmaz</strong>
                  <span><ico.phone /> 0 512 345 67 89</span>
                  <span><ico.mapPin /> Bahçelievler Mah. 34. Sokak</span>
                </div>
                <div className="hoc-fin">
                  <div><span>Toplam</span><strong>750 ₺</strong></div>
                  <div><span>Ödenen</span><strong className="ok">250 ₺</strong></div>
                  <div><span>Kalan</span><strong className="due">500 ₺</strong></div>
                </div>
                <div className="hoc-progress">
                  <span className="hoc-dot done" />
                  <span className="hoc-bar done" />
                  <span className="hoc-dot active" />
                  <span className="hoc-bar" />
                  <span className="hoc-dot" />
                  <span className="hoc-bar" />
                  <span className="hoc-dot" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* İNTERAKTİF SÜREÇ */}
        <section className="interactive-process-section" id="nasil-calisir">
          <div className="process-container">
            <div className="process-text-side">
              <h2 className="process-title">Sistem nasıl işliyor?</h2>
              <div className="process-steps-vertical">
                {STEPS.map((step) => (
                  <button
                    type="button"
                    key={step.id}
                    className={`v-step ${activeStep === step.id ? 'active' : ''}`}
                    aria-pressed={activeStep === step.id}
                    onClick={() => setActiveStep(step.id)}
                  >
                    <div className="v-step-indicator">
                      <div className="v-step-dot"></div>
                      {step.id !== 4 && <div className="v-step-line"></div>}
                    </div>
                    <div className="v-step-content">
                      <h3>{step.title}</h3>
                      <p>{step.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="process-visual-side">
              <div className={`process-visual-card ${activeStep === 1 ? 'active' : ''}`} aria-hidden={activeStep !== 1}>
                <div className="pv-card-inner">
                  <div className="pv-header">Yeni Sipariş Oluştur</div>
                  <div className="pv-body">
                    <div className="pv-input">Müşteri: <strong>Ahmet Yılmaz</strong></div>
                    <div className="pv-row"><div className="pv-box">Makine Halısı</div><div className="pv-box">4.50 m²</div></div>
                    <div className="pv-row"><div className="pv-box">El Dokuma</div><div className="pv-box">2.00 m²</div></div>
                    <div className="pv-total">Toplam: 750,00 TL</div>
                  </div>
                </div>
              </div>

              <div className={`process-visual-card ${activeStep === 2 ? 'active' : ''}`} aria-hidden={activeStep !== 2}>
                <div className="pv-card-inner">
                  <div className="pv-header" style={{ borderBottom: 'none' }}>Durum Güncelle</div>
                  <div className="pv-status-selector">
                    <div className="pv-status-option completed"><ico.check /> Teslim Alındı</div>
                    <div className="pv-status-option active"><ico.refresh className="spin-icon" /> Yıkanıyor</div>
                    <div className="pv-status-option"><ico.circle /> Kurulanıyor</div>
                    <div className="pv-status-option"><ico.circle /> Paketlendi</div>
                  </div>
                </div>
              </div>

              <div className={`process-visual-card ${activeStep === 3 ? 'active' : ''}`} aria-hidden={activeStep !== 3}>
                <div className="pv-card-inner" style={{ background: '#E1F3FB', padding: '16px', border: '1px solid #c2e5f5' }}>
                  <div className="pv-wa-msg">
                    <strong>Halı Yıkama Uygulaması</strong>
                    <p style={{ marginTop: '8px', marginBottom: '12px' }}>Merhaba Ahmet Bey,<br /><br />Halılarınızın yıkama işlemi tamamlandı ve kurutma odalarına alındı.</p>
                    <div className="pv-wa-pdf"><ico.file /> irsaliye-1042.pdf</div>
                  </div>
                </div>
              </div>

              <div className={`process-visual-card ${activeStep === 4 ? 'active' : ''}`} aria-hidden={activeStep !== 4}>
                <div className="pv-card-inner">
                  <div className="pv-header">Ödeme Al</div>
                  <div className="pv-payment">
                    <div className="pv-pay-kalan">Kalan Borç: <strong>500,00 TL</strong></div>
                    <div className="pv-pay-input">Tutar: 500,00 TL</div>
                    <div className="pv-pay-btn">Nakit Ödeme</div>
                    {activeStep === 4 && <div className="pv-pay-success"><ico.check /> Sipariş Tamamlandı</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DURUM YAŞAM DÖNGÜSÜ ŞERİDİ */}
        <section className="lifecycle-section" id="ozellikler">
          <Reveal className="lc-inner">
            <h2>Her sipariş, teslim alındıdan teslim edildiye izlenir</h2>
            <p className="lc-sub">Altı net aşama. Personel tek tıkla günceller, müşteri her adımda haberdar olur.</p>
            <ol className="lc-track">
              {LIFECYCLE.map(({ label, Icon, state }, i) => (
                <li key={label} className={`lc-step ${state}`}>
                  <span className="lc-dot"><Icon /></span>
                  <span className="lc-label">{label}</span>
                  {i !== LIFECYCLE.length - 1 && <span className={`lc-connector ${state === 'done' ? 'done' : ''}`} />}
                </li>
              ))}
            </ol>
          </Reveal>
        </section>

        {/* BANT: PDF İRSALİYE (metin sol / kâğıt sağ) */}
        <section className="cap-section">
          <Reveal className="cap-row">
            <div className="cap-text">
              <h2>Tek tıkla PDF irsaliyeler</h2>
              <p>Müşterilerinize saniyeler içinde kurumsal irsaliyeler oluşturun. WhatsApp üzerinden gönderin veya çıktı alın.</p>
              <ul className="cap-list">
                <li><span className="cap-check"><ico.check /></span> Otomatik m² ve tutar hesaplama</li>
                <li><span className="cap-check"><ico.check /></span> Kalan borç ve ödeme geçmişi</li>
                <li><span className="cap-check"><ico.check /></span> Kurumsal ve şık tasarım</li>
              </ul>
            </div>
            <div className="cap-visual">
              <div className="invoice-paper">
                <div className="invoice-header">
                  <h3>HALI YIKAMA UYGULAMASI İRSALİYESİ</h3>
                  <span>Tarih: {new Date().toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="invoice-info">
                  <div><small>Müşteri</small><strong>Ahmet Yılmaz</strong><span>0 512 345 67 89</span></div>
                  <div style={{ textAlign: 'right' }}><small>Sipariş No</small><strong>#1042</strong><span>IRS-1042</span></div>
                </div>
                <table className="invoice-table">
                  <thead><tr><th>Halı Tipi</th><th style={{ textAlign: 'center' }}>m²</th><th style={{ textAlign: 'right' }}>Tutar</th></tr></thead>
                  <tbody>
                    <tr><td>Makine Halısı</td><td style={{ textAlign: 'center' }}>4.50</td><td style={{ textAlign: 'right' }}>450,00 TL</td></tr>
                    <tr><td>El Dokuma</td><td style={{ textAlign: 'center' }}>2.00</td><td style={{ textAlign: 'right' }}>300,00 TL</td></tr>
                  </tbody>
                </table>
                <div className="invoice-total">
                  <div className="invoice-total-row"><span>Ödenen</span> <span>250,00 TL</span></div>
                  <div className="invoice-total-row highlight"><span>Kalan Borç</span> <span>500,00 TL</span></div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* BANT: WHATSAPP (telefon sol / metin sağ) */}
        <section className="cap-section">
          <Reveal className="cap-row reverse">
            <div className="cap-visual">
              <div className="whatsapp-phone-mockup">
                <div className="wa-header">
                  <div className="wa-header-left">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    <div className="wa-avatar">AY</div>
                    <div className="wa-contact-info"><strong>Ahmet Yılmaz</strong><span>çevrimiçi</span></div>
                  </div>
                  <div className="wa-header-right">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  </div>
                </div>
                <div className="wa-body">
                  <div className="wa-date-bubble">Bugün</div>
                  <div className="wa-message out">
                    Merhaba Ahmet Yılmaz,<br /><br />Halılarınız adresinizden güvenle teslim alınmıştır. Bir sonraki aşamada yıkama işlemine alınacaktır.
                    <span className="wa-time">14:30 <span className="wa-ticks">✓✓</span></span>
                  </div>
                  <div className="wa-message out wa-pdf-message">
                    <div className="wa-pdf-attachment">
                      <div className="pdf-icon-bg"><ico.file /></div>
                      <div className="pdf-info"><strong>irsaliye-IRS-1042.pdf</strong><span>1.2 MB · PDF Belgesi</span></div>
                    </div>
                    <span className="wa-time">14:32 <span className="wa-ticks">✓✓</span></span>
                  </div>
                </div>
                <div className="wa-footer">
                  <div className="wa-plus-icon">+</div>
                  <div className="wa-input-box">Mesaj yazın</div>
                  <div className="wa-send-btn"><svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg></div>
                </div>
              </div>
            </div>
            <div className="cap-text">
              <h2>Tek tıkla WhatsApp iletişimi</h2>
              <p>Müşterilerinizi her aşamada otomatik şablonlarla bilgilendirin. Manuel mesaj yazma derdine son verin, kurumsal bir imaj çizin.</p>
              <ul className="cap-list">
                <li><span className="cap-check"><ico.check /></span> Durum bildirimleri</li>
                <li><span className="cap-check"><ico.check /></span> PDF irsaliye ve makbuz gönderimi</li>
                <li><span className="cap-check"><ico.check /></span> İsme özel dinamik şablonlar</li>
              </ul>
            </div>
          </Reveal>
        </section>

        {/* BANT: FİNANS & ANALİZ (mockup sol / metin sağ) */}
        <section className="cap-section">
          <Reveal className="cap-row">
            <div className="cap-visual">
              <div className="finance-card">
                <div className="fc-head">
                  <span className="fc-title">Aylık ciro</span>
                  <span className="fc-amount">42.750 ₺</span>
                </div>
                <div className="fc-bars" aria-hidden="true">
                  {[42, 55, 38, 70, 62, 88].map((h, i) => (
                    <span key={i} className="fc-bar" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="fc-stats">
                  <div className="fc-stat"><span>Tahsil edilen</span><strong className="ok">31.200 ₺</strong></div>
                  <div className="fc-stat"><span>Bekleyen</span><strong className="due">11.550 ₺</strong></div>
                </div>
              </div>
            </div>
            <div className="cap-text">
              <h2>Finans ve analiz tek bakışta</h2>
              <p>Nakit, kredi kartı veya havale ödemelerini takip edin. Bekleyen tahsilatları ve aylık ciro grafiğinizi panodan izleyin.</p>
              <ul className="cap-list">
                <li><span className="cap-check"><ico.chart /></span> Aylık ciro ve tahsilat grafiği</li>
                <li><span className="cap-check"><ico.users /></span> Personel bazlı işlem geçmişi (log)</li>
                <li><span className="cap-check"><ico.sparkles /></span> Bekleyen borçlar için anlık özet</li>
              </ul>
            </div>
          </Reveal>
        </section>

        {/* KAPANIŞ CTA BANDI */}
        <section className="cta-section">
          <Reveal className="cta-inner">
            <h2>İşletmenizi düzene sokmaya hazır mısınız?</h2>
            <p>Halı Yıkama Uygulaması'nı işletmenize göre kuralım. Birkaç dakikada başlayın.</p>
            <div className="cta-actions">
              <a href="mailto:hali.temizleme@protonmail.com" className="cta-primary-large">İletişime geçin <ico.arrowRight /></a>
              <Link to="/login" className="cta-ghost">Giriş yap</Link>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  );
}
