import React from 'react';
import { motion } from 'framer-motion';

export default function RouteFeatureSection() {
  // Sokaklardan geçen, köşeleri yumuşatılmış 90 derecelik kavşaklara sahip kusursuz SVG rotası
  const pathData = "M 60 260 L 200 260 Q 220 260 220 240 L 220 100 Q 220 80 240 80 L 420 80 Q 440 80 440 100 L 440 140";

  return (
    <section style={{ padding: 'clamp(64px, 8vw, 100px) 24px', backgroundColor: '#ffffff', overflow: 'hidden' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '64px' }}>

        {/* BÖLÜM 1: Kurumsal Metin ve Özellikler */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 14px', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '999px', fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', width: 'fit-content' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', color: '#2563eb' }}>
              <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"></path>
              <circle cx="6" cy="19" r="3"></circle>
              <circle cx="18" cy="5" r="3"></circle>
            </svg>
            Operasyon & Lojistik
          </div>
          
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', color: '#0f172a', fontWeight: '800', lineHeight: '1.15', margin: 0, letterSpacing: '-0.02em' }}>
            Teslimatları harita üzerinde planlayın
          </h2>
          
          <p style={{ fontSize: '1.125rem', color: '#475569', lineHeight: '1.6', margin: '0 0 8px 0' }}>
            Paketlenen siparişlerinizi harita üzerinde listeleyin. Sistem, duraklar arası <strong>en kısa ve optimize edilmiş güzergahı</strong> anında hesaplar. Yakıttan ve zamandan tasarruf sağlayın.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ padding: '10px', backgroundColor: '#ffffff', color: '#2563eb', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(15,23,42,0.04)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '1.05rem', fontWeight: '700' }}>Akıllı Rota Planlaması</h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>Seçtiğiniz teslimat adresleri saniyeler içinde sıralı bir dağıtım planına dönüşür.</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ padding: '10px', backgroundColor: '#ffffff', color: '#2563eb', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(15,23,42,0.04)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '1.05rem', fontWeight: '700' }}>Sürükle-Bırak Kontrolü</h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>Teslimat önceliklerinizi değiştirin. Sıralamayı sürükleyerek dilediğiniz gibi güncelleyin.</p>
              </div>
            </div>
          </div>
        </div>

        {/* BÖLÜM 2: Hareketli Harita ve Araç Animasyonu (Uygulama Penceresi İçinde) */}
        <div style={{ flex: '1 1 500px', position: 'relative', backgroundColor: '#f8fafc', borderRadius: '24px', padding: '12px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px -15px rgba(15,23,42,0.1)' }}>
          
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', position: 'relative' }}>
            {/* Mac-style Window Header */}
            <div style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#fca5a5' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#fde047' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#86efac' }}></div>
              <div style={{ flex: 1, textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>ROTA OPTİMİZASYONU</div>
            </div>

            {/* Rozet */}
            <div style={{ position: 'absolute', top: '64px', left: '16px', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)', padding: '10px 14px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(15,23,42,0.08)', border: '1px solid #e2e8f0', zIndex: 10, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <motion.div
                style={{ width: '10px', height: '10px', backgroundColor: '#2563eb', borderRadius: '50%' }}
                animate={{ boxShadow: ['0 0 0 0 rgba(37,99,235,0.4)', '0 0 0 6px rgba(37,99,235,0)'] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Rota Planı Optimize Edildi</div>
            </div>

            <svg viewBox="0 0 500 340" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <path id="animRouteLine" d={pathData} />
              </defs>

              {/* ŞEHİR ZEMİNİ (Açık Gri) */}
              <rect x="0" y="0" width="500" height="340" fill="#f1f5f9" />

              {/* YOLLAR (Beyaz Kalın Şeritler) */}
              <path d="M 0 80 L 500 80 M 0 180 L 500 180 M 0 260 L 500 260 M 100 0 L 100 340 M 220 0 L 220 340 M 330 0 L 330 340 M 440 0 L 440 340" stroke="#ffffff" strokeWidth="24" strokeLinecap="square" />

              {/* BİNALAR VE PARKLAR (Şehir Blokları) */}
              <g fill="#e2e8f0">
                {/* 1. Satır */}
                <rect x="20" y="20" width="56" height="36" rx="4" />
                <rect x="124" y="20" width="72" height="36" rx="4" />
                <rect x="244" y="20" width="62" height="36" rx="4" />
                <rect x="354" y="20" width="62" height="36" rx="4" fill="#d1fae5" /> {/* Park */}
                <rect x="464" y="20" width="36" height="36" rx="4" />
                
                {/* 2. Satır */}
                <rect x="20" y="104" width="56" height="52" rx="4" fill="#d1fae5" />
                <rect x="124" y="104" width="72" height="52" rx="4" />
                <rect x="244" y="104" width="62" height="52" rx="4" />
                <rect x="354" y="104" width="62" height="52" rx="4" />
                <rect x="464" y="104" width="36" height="52" rx="4" fill="#d1fae5" />

                {/* 3. Satır */}
                <rect x="20" y="204" width="56" height="32" rx="4" />
                <rect x="124" y="204" width="72" height="32" rx="4" />
                <rect x="244" y="204" width="62" height="32" rx="4" fill="#d1fae5" />
                <rect x="354" y="204" width="62" height="32" rx="4" />
                <rect x="464" y="204" width="36" height="32" rx="4" />

                {/* 4. Satır */}
                <rect x="20" y="284" width="56" height="36" rx="4" fill="#d1fae5" />
                <rect x="124" y="284" width="72" height="36" rx="4" />
                <rect x="244" y="284" width="62" height="36" rx="4" />
                <rect x="354" y="284" width="62" height="36" rx="4" />
                <rect x="464" y="284" width="36" height="36" rx="4" />
              </g>

              {/* ROTA ÇİZGİSİ */}
              <path d={pathData} fill="none" stroke="#cbd5e1" strokeWidth="6" strokeDasharray="8 8" />

              {/* Animasyonlu Mavi Çizgi (Araç ile aynı hızda ilerler) */}
              <motion.path
                d={pathData} fill="none" stroke="#2563eb" strokeWidth="6"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* DURAKLAR (Pinler ve Bilgi Kutuları) */}
              <circle cx="60" cy="260" r="8" fill="#ffffff" stroke="#2563eb" strokeWidth="4" />
              <rect x="18" y="278" width="84" height="24" rx="6" fill="#ffffff" stroke="#e2e8f0" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))' }} />
              <text x="60" y="294" fontSize="11" fontWeight="700" fill="#475569" textAnchor="middle">📍 1. Durak</text>

              <circle cx="220" cy="100" r="8" fill="#ffffff" stroke="#2563eb" strokeWidth="4" />
              <rect x="178" y="118" width="84" height="24" rx="6" fill="#ffffff" stroke="#e2e8f0" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))' }} />
              <text x="220" y="134" fontSize="11" fontWeight="700" fill="#475569" textAnchor="middle">📍 2. Durak</text>

              <circle cx="440" cy="140" r="10" fill="#059669" stroke="#ffffff" strokeWidth="4" />
              <rect x="390" y="158" width="100" height="26" rx="6" fill="#ecfdf5" stroke="#a7f3d0" style={{ filter: 'drop-shadow(0 2px 4px rgba(16,185,129,0.1))' }} />
              <text x="440" y="175" fontSize="11" fontWeight="700" fill="#059669" textAnchor="middle">🚩 Son Durak</text>

              {/* Hareketli Kurumsal Kamyonet */}
              <g>
                <rect x="-16" y="-3" width="32" height="16" fill="rgba(15,23,42,0.15)" rx="4" />
                <rect x="-16" y="-12" width="20" height="20" fill="#2563eb" rx="2" />
                <path d="M 4 -6 L 12 -6 L 16 0 L 16 8 L 4 8 Z" fill="#1e293b" />
                <polygon points="6,-3 11,-3 13,1 6,1" fill="#e2e8f0" />
                <rect x="14" y="4" width="3" height="3" fill="#fbbf24" rx="1" />
                <circle cx="-6" cy="8" r="4" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="10" cy="8" r="4" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />

                {/* Yönünü yola göre (kavşaklarda) otomatik ayarlayarak ilerleme animasyonu */}
                <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
                  <mpath href="#animRouteLine" />
                </animateMotion>
              </g>
            </svg>
          </div>
        </div>

      </div>
    </section>
  )
}