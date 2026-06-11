import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import { formatPara } from '../utils/helpers'

export default function DashboardTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { kullanici } = useAuth()
  // Sadece admin veya user (patron) statüsünde olanlar grafikleri görebilir
  const isPatron = kullanici?.role !== 'personnel'

  useEffect(() => {
    fetchStats('', '')
  }, [])

  const fetchStats = async (start, end) => {
    setLoading(true)
    try {
      const res = await api.get('/orders/stats', {
        params: {
          start_date: start || undefined,
          end_date: end || undefined
        }
      })
      setStats(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = () => fetchStats(startDate, endDate)
  
  const handleClear = () => {
    setStartDate('')
    setEndDate('')
    fetchStats('', '')
  }

  if (loading && !stats) return <section className="card"><p className="empty">Yükleniyor...</p></section>
  if (!stats) return null
  
  const graphData = stats.gunluk_grafik || stats.aylik_grafik;
  const labelKey = stats.gunluk_grafik ? 'gun' : 'ay';

  // Pasta Grafik (Pie Chart) Verisi
  const pieData = [
    { name: 'Teslim Alındı', value: (stats.durum_counts.alindi || 0) + (stats.durum_counts.teslim_alindi || 0), fill: '#334155' },
    { name: 'Yıkanıyor', value: (stats.durum_counts.temizleniyor || 0) + (stats.durum_counts.yikaniyor || 0), fill: '#0369A1' },
    { name: 'Kurulanıyor', value: stats.durum_counts.kurulaniyor || 0, fill: '#B45309' },
    { name: 'Paketlendi', value: (stats.durum_counts.hazir || 0) + (stats.durum_counts.paketlendi || 0), fill: '#0F766E' },
    { name: 'Teslimata Çıktı', value: stats.durum_counts.teslimata_cikti || 0, fill: '#6D28D9' },
    { name: 'Teslim Edildi', value: stats.durum_counts.teslim_edildi || 0, fill: '#15803D' }
  ].filter(d => d.value > 0);

  return (
    <div className="dashboard-stats">
      {/* 1. OPERASYONEL VERİLER (En Üstte) */}
      <div className="stat-row mini-stats" style={{ marginBottom: '20px' }}>
        <div className="stat-card-mini">
          <div className="stat-label">Toplam Sipariş</div>
          <div className="stat-value-mini">{stats.toplam_siparis}</div>
        </div>
        <div className="stat-card-mini">
          <div className="stat-label">Müşteri Sayısı</div>
          <div className="stat-value-mini">{stats.musteri_sayisi}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <section className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2>Sipariş Durumları</h2>
          <div className="durum-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', flex: 1, alignContent: 'start' }}>
            <div className="durum-box" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
              <div className="durum-count" style={{ color: '#334155' }}>{(stats.durum_counts.alindi || 0) + (stats.durum_counts.teslim_alindi || 0)}</div>
              <div className="durum-label" style={{ color: '#64748B' }}>Teslim Alındı</div>
            </div>
            <div className="durum-box" style={{ background: '#E0F2FE', border: '1px solid #BAE6FD' }}>
              <div className="durum-count" style={{ color: '#0369A1' }}>{(stats.durum_counts.temizleniyor || 0) + (stats.durum_counts.yikaniyor || 0)}</div>
              <div className="durum-label" style={{ color: '#0284C7' }}>Yıkanıyor</div>
            </div>
            <div className="durum-box" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
              <div className="durum-count" style={{ color: '#B45309' }}>{stats.durum_counts.kurulaniyor || 0}</div>
              <div className="durum-label" style={{ color: '#D97706' }}>Kurulanıyor</div>
            </div>
            <div className="durum-box" style={{ background: '#CCFBF1', border: '1px solid #99F6E4' }}>
              <div className="durum-count" style={{ color: '#0F766E' }}>{(stats.durum_counts.hazir || 0) + (stats.durum_counts.paketlendi || 0)}</div>
              <div className="durum-label" style={{ color: '#0D9488' }}>Paketlendi</div>
            </div>
            <div className="durum-box" style={{ background: '#EDE9FE', border: '1px solid #DDD6FE' }}>
              <div className="durum-count" style={{ color: '#6D28D9' }}>{stats.durum_counts.teslimata_cikti || 0}</div>
              <div className="durum-label" style={{ color: '#7C3AED' }}>Teslimata Çıktı</div>
            </div>
            <div className="durum-box" style={{ background: '#DCFCE7', border: '1px solid #BBF7D0' }}>
              <div className="durum-count" style={{ color: '#15803D' }}>{stats.durum_counts.teslim_edildi || 0}</div>
              <div className="durum-label">Teslim Edildi</div>
            </div>
          </div>
        </section>

        <section className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2>Sipariş Dağılımı</h2>
          <div style={{ flex: 1, minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} Sipariş`, name]}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.15)' }}
                    itemStyle={{ fontWeight: 600, color: '#0f172a' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="empty" style={{ margin: 0, padding: 0 }}>Sipariş verisi yok.</p>
            )}
          </div>
        </section>
      </div>

      {/* 2. FİNANSAL VERİLER (Patron Özel - Altta Grup Halinde) */}
      {isPatron && (
        <div className="finansal-ozet-bolumu">
          <div className="filter-row card" style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'flex-end', padding: '16px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>Başlangıç Tarihi</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '8px 12px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>Bitiş Tarihi</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '8px 12px' }} />
            </div>
            <button className="btn-primary" onClick={handleFilter} style={{ padding: '9px 16px' }}>Filtrele</button>
            {(startDate || endDate) && (
              <button className="btn-secondary" onClick={handleClear} style={{ padding: '9px 16px' }}>Temizle</button>
            )}
          </div>

          {(() => {
            const toplam = Number(stats.toplam_ciro) || 0
            const bekleyen = Number(stats.bekleyen_tahsilat) || 0
            const tahsil = Math.max(toplam - bekleyen, 0)
            const oran = toplam > 0 ? Math.round((tahsil / toplam) * 100) : 0
            const temiz = bekleyen <= 0
            return (
              <div className="fin-grid">
                <div className="fin-card">
                  <div className="fin-top">
                    <span className="fin-ico accent">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </span>
                    <span className="fin-label">Toplam Ciro</span>
                  </div>
                  <div className="fin-value">{formatPara(toplam)}</div>
                  <div className="fin-sub"><b>{stats.toplam_siparis}</b> sipariş · <b>{stats.musteri_sayisi}</b> müşteri</div>
                </div>

                <div className="fin-card">
                  <div className="fin-top">
                    <span className={`fin-ico ${temiz ? 'ok' : 'warn'}`}>
                      {temiz ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      )}
                    </span>
                    <span className="fin-label">Bekleyen Tahsilat</span>
                  </div>
                  <div className="fin-value">{formatPara(bekleyen)}</div>
                  <div className="fin-bar"><div className="fin-bar-fill" style={{ width: `${oran}%` }} /></div>
                  <div className="fin-sub">
                    {temiz ? 'Tüm tahsilat tamamlandı' : <>%<b>{oran}</b> tahsil edildi · <b>{formatPara(tahsil)}</b> alındı</>}
                  </div>
                </div>
              </div>
            )
          })()}

          {graphData && (
            <section className="card" style={{ marginTop: '20px' }}>
              <h2>{stats.gunluk_grafik ? 'Seçilen Tarih Aralığı Günlük Ciro' : 'Bu Yılın Aylık Ciro Grafiği'}</h2>
              <div style={{ width: '100%', height: 350, marginTop: '20px' }}>
                <ResponsiveContainer>
                  <ComposedChart data={graphData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="5 5" vertical={false} />
                    <XAxis dataKey={labelKey} stroke="#64748b" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `${val.toLocaleString('tr-TR')} ₺`} width={80} axisLine={false} tickLine={false} />
                    <Tooltip 
                      formatter={(value) => [formatPara(value), 'Ciro']}
                      labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '8px' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.15)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    
                    {/* Arkadaki Gölgeli Sütun Grafiği */}
                    <Bar dataKey="ciro" name="Aylık/Günlük Hacim (Sütun)" barSize={40} fill="#94a3b8" radius={[4, 4, 0, 0]} opacity={0.25} />
                    
                    {/* Öndeki Keskin Çizgi Grafiği */}
                    <Line type="monotone" dataKey="ciro" name="Net Ciro (Çizgi)" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, stroke: '#059669' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}