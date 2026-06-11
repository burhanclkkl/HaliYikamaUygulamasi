import React from 'react';
import './Footer.css';

/* Site geneli profesyonel footer — Landing + Login (+ ileride panolar) tek kaynak.
   Renkler kendi içinde tanımlı (tema token'larına bağlı değil), her yerde çalışır. */
export default function Footer() {
  const mail = 'mailto:hali.temizleme@protonmail.com';
  return (
    <footer className="bf-footer">
      <div className="bf-inner">
        <div className="bf-brand">
          <div className="bf-logo">
            <span className="bf-logo-mark" aria-hidden="true">H</span>
            <span className="bf-logo-text"><b>Halı Yıkama</b> <span>Uygulaması</span></span>
          </div>
          <p className="bf-tagline">
            Halı yıkama işletmeleri için sipariş, müşteri, ödeme ve personel yönetimini tek panoda toplayan CRM.
          </p>
          <a href={mail} className="bf-contact">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            hali.temizleme@protonmail.com
          </a>
        </div>

        <div className="bf-col">
          <h4>Hızlı erişim</h4>
          <ul>
            <li><a href="/#nasil-calisir">Nasıl çalışır</a></li>
            <li><a href="/#ozellikler">Özellikler</a></li>
            <li><a href="/login">Giriş yap</a></li>
          </ul>
        </div>

        <div className="bf-col">
          <h4>İletişim</h4>
          <ul>
            <li><a href={mail}>E-posta gönderin</a></li>
            <li><a href={mail}>Demo talep edin</a></li>
            <li><a href={mail}>Destek</a></li>
          </ul>
        </div>
      </div>

      <div className="bf-bottom">
        <div className="bf-bottom-inner">
          <p>© {new Date().getFullYear()} Halı Yıkama Uygulaması. Tüm hakları saklıdır.</p>
          <p><a href={mail}>hali.temizleme@protonmail.com</a></p>
        </div>
      </div>
    </footer>
  );
}
