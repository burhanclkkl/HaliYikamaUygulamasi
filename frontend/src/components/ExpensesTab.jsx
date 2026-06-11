import { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import ErrorModal from './ErrorModal'
import ConfirmModal from './ConfirmModal'
import Modal from './Modal'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'

/* Tutarlı stroke SVG ikon ailesi */
const ico = {
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
  wallet: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
}

const formatPara = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);
const formatTarih = (str) => str ? new Date(str).toLocaleDateString('tr-TR') : '-';

export default function ExpensesTab() {
  const [harcamalar, setHarcamalar] = useState([])
  const [kategorilerData, setKategorilerData] = useState([])
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [newCat, setNewCat] = useState({ ad: '', turlerText: '' })
  const [loading, setLoading] = useState(true)
  const [arama, setArama] = useState('')
  const [durumFiltre, setDurumFiltre] = useState('hepsi')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [modal, setModal] = useState(null)
  const [errorModal, setErrorModal] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  const formBos = {
    tutar: '',
    kategori: '',
    tur: '',
    aciklama: '',
    tarih: new Date().toISOString().split('T')[0],
    durum: 'ödendi',
    odeme_yontemi: 'nakit'
  }
  const [form, setForm] = useState(formBos)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const [resExp, resCat] = await Promise.all([
        api.get('/expenses'),
        api.get('/expenses/categories')
      ])
      setHarcamalar(resExp.data.harcamalar || [])
      setKategorilerData(resCat.data.kategoriler || [])
    } catch (err) {
      setErrorModal({ baslik: "Hata", mesaj: "Harcamalar yüklenirken bir hata oluştu." })
    } finally {
      setLoading(false)
    }
  }

  const openNew = () => {
    setForm(formBos)
    setModal({ mode: 'new' })
  }

  const openEdit = (h) => {
    setForm({
      tutar: h.tutar,
      kategori: h.kategori,
      tur: h.tur || '',
      aciklama: h.aciklama || '',
      tarih: h.tarih,
      durum: h.durum,
      odeme_yontemi: h.odeme_yontemi || 'nakit'
    })
    setModal({ mode: 'edit', data: h })
  }

  const save = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        odeme_yontemi: form.durum === 'ödendi' ? form.odeme_yontemi : null
      }

      if (modal.mode === 'new') {
        await api.post('/expenses', payload)
      } else {
        await api.put(`/expenses/${modal.data.id}`, payload)
      }
      setModal(null)
      load()
    } catch (err) {
      setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Harcama kaydedilemedi.' })
    }
  }

  const sil = (h) => {
    setConfirmModal({
      baslik: "Harcamayı Sil",
      mesaj: `${formatPara(h.tutar)} tutarındaki '${h.kategori} - ${h.tur}' harcamasını kalıcı olarak silmek istediğinize emin misiniz?`,
      onConfirm: async () => {
        setConfirmModal(null)
        try {
          await api.delete(`/expenses/${h.id}`)
          load()
        } catch (err) {
          setErrorModal({ baslik: "Hata", mesaj: 'Harcama silinemedi.' })
        }
      }
    })
  }

  // Kategori Yönetimi Fonksiyonları
  const createCat = async () => {
    if (!newCat.ad.trim()) return;
    try {
      await api.post('/expenses/categories', {
        ad: newCat.ad.trim(),
        turler: newCat.turlerText.split(',').map(s => s.trim()).filter(Boolean)
      })
      setNewCat({ ad: '', turlerText: '' })
      load()
    } catch (err) { setErrorModal({ baslik: "Hata", mesaj: "Kategori eklenemedi." }) }
  }

  const saveCat = async (k) => {
    try {
      await api.put(`/expenses/categories/${k.id}`, { ad: k.ad, turler: k.turler })
      load()
    } catch (err) { setErrorModal({ baslik: "Hata", mesaj: "Kategori güncellenemedi." }) }
  }

  const deleteCat = async (id) => {
    setConfirmModal({
      baslik: "Kategoriyi Sil",
      mesaj: "Bu kategoriyi silmek istediğinize emin misiniz? (Daha önce bu kategori ile kaydettiğiniz geçmiş harcamalarınız silinmez, sadece seçim listesinden kaldırılır)",
      onConfirm: async () => {
        setConfirmModal(null)
        try {
          await api.delete(`/expenses/categories/${id}`)
          load()
        } catch (err) { setErrorModal({ baslik: "Hata", mesaj: "Kategori silinemedi." }) }
      }
    })
  }

  const filtreliHarcamalar = useMemo(() => {
    return harcamalar.filter(h => {
      const query = arama.toLocaleLowerCase('tr-TR')
      const matchArama = !arama || (
        (h.kategori || '').toLocaleLowerCase('tr-TR').includes(query) ||
        (h.tur || '').toLocaleLowerCase('tr-TR').includes(query) ||
        (h.aciklama || '').toLocaleLowerCase('tr-TR').includes(query)
      )
      const matchDurum = durumFiltre === 'hepsi' || h.durum === durumFiltre
      
      let matchDate = true
      if (startDate || endDate) {
        const hDate = h.tarih ? h.tarih.split('T')[0] : ''
        if (startDate && hDate < startDate) matchDate = false
        if (endDate && hDate > endDate) matchDate = false
      }

      return matchArama && matchDurum && matchDate
    })
  }, [harcamalar, arama, durumFiltre, startDate, endDate])

  // Dinamik Kategoriler (DB'deki Kategoriler + Mevcut Harcamalar)
  const dinamikKategoriler = useMemo(() => {
    const set = new Set(kategorilerData.map(k => k.ad))
    harcamalar.forEach(h => { if (h.kategori) set.add(h.kategori) })
    return Array.from(set).sort()
  }, [harcamalar, kategorilerData])

  // Dinamik Türler (Seçili kategoriye göre)
  const dinamikTurler = useMemo(() => {
    const seciliKategori = kategorilerData.find(k => k.ad === form.kategori)
    const set = new Set(seciliKategori ? seciliKategori.turler : [])
    harcamalar.forEach(h => {
      if (h.kategori === form.kategori && h.tur) set.add(h.tur)
    })
    return Array.from(set).sort()
  }, [harcamalar, form.kategori, kategorilerData])

  // İstatistikler (Filtrelenmiş verilere göre anlık çalışır)
  const istatistikler = useMemo(() => {
    const toplam = filtreliHarcamalar.reduce((sum, h) => sum + parseFloat(h.tutar || 0), 0)
    const odenen = filtreliHarcamalar.filter(h => h.durum === 'ödendi').reduce((sum, h) => sum + parseFloat(h.tutar || 0), 0)
    const kalan = filtreliHarcamalar.filter(h => h.durum === 'ödenecek').reduce((sum, h) => sum + parseFloat(h.tutar || 0), 0)
    return { toplam, odenen, kalan }
  }, [filtreliHarcamalar])

  // Pasta Grafik Verisi (Kategorilere Göre)
  const categoryPieData = useMemo(() => {
    const grouped = {}
    filtreliHarcamalar.forEach(h => {
      const cat = h.kategori || 'Diğer'
      const val = parseFloat(h.tutar || 0)
      if (!grouped[cat]) grouped[cat] = 0
      grouped[cat] += val
    })
    return Object.keys(grouped).map(k => ({ name: k, value: grouped[k] })).sort((a, b) => b.value - a.value)
  }, [filtreliHarcamalar])

  const PIE_COLORS = ['#2563EB', '#059669', '#D97706', '#0284C7', '#7C3AED', '#DB2777', '#EA580C', '#475569']

  // Çubuk Grafik Verisi (Günlük Harcama Trendi)
  const timeBarData = useMemo(() => {
    const grouped = {}
    filtreliHarcamalar.forEach(h => {
      if (!h.tarih) return
      const d = h.tarih.split('T')[0]
      const val = parseFloat(h.tutar || 0)
      if (!grouped[d]) grouped[d] = 0
      grouped[d] += val
    })
    return Object.keys(grouped).sort().map(k => ({
      tarih: new Date(k).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
      tutar: grouped[k]
    }))
  }, [filtreliHarcamalar])

  return (
    <section>
      {/* ÖZET KARTLARI */}
      <div className="fin-grid" style={{ marginBottom: '24px' }}>
        <div className="fin-card">
          <div className="fin-top">
            <div className="fin-ico accent">{ico.wallet}</div>
            <div className="fin-label">Toplam Harcama</div>
          </div>
          <div className="fin-value">{formatPara(istatistikler.toplam)}</div>
        </div>
        <div className="fin-card" style={{ borderColor: '#bbf7d0', background: '#f0fdf4' }}>
          <div className="fin-top">
            <div className="fin-ico ok">{ico.check}</div>
            <div className="fin-label" style={{ color: '#166534' }}>Ödenen Harcamalar</div>
          </div>
          <div className="fin-value" style={{ color: '#14532d' }}>{formatPara(istatistikler.odenen)}</div>
        </div>
        <div className="fin-card" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
          <div className="fin-top">
            <div className="fin-ico warn" style={{ background: '#fee2e2', color: '#dc2626' }}>{ico.clock}</div>
            <div className="fin-label" style={{ color: '#991b1b' }}>Ödenecek Harcamalar</div>
          </div>
          <div className="fin-value" style={{ color: '#7f1d1d' }}>{formatPara(istatistikler.kalan)}</div>
        </div>
      </div>

      {/* ANA TABLO KARTI */}
      <div className="card">
        <div className="card-header">
          <h2>Harcama Kayıtları ({filtreliHarcamalar.length})</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secondary" onClick={() => setCatModalOpen(true)}>Kategori Yönetimi</button>
            <button className="btn-primary" onClick={openNew}>+ Yeni Harcama</button>
          </div>
        </div>

        <div className="filter-row" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: '1 1 250px', marginBottom: 0 }}>
            <input
              type="text"
              placeholder="Kategori, tür veya açıklama ile ara..."
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              style={{ padding: '10px 16px', width: '100%' }}
            />
            {arama && <button className="search-clear" onClick={() => setArama('')}>✕</button>}
          </div>
          <select
            className="durum-filtre"
            value={durumFiltre}
            onChange={(e) => setDurumFiltre(e.target.value)}
            style={{ flex: '1 1 150px', padding: '0 12px', height: '40px' }}
          >
            <option value="hepsi">Tüm Durumlar</option>
            <option value="ödendi">Ödenenler</option>
            <option value="ödenecek">Ödenecekler</option>
          </select>

          {/* Tarih Filtreleri */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap', alignItems: 'center', backgroundColor: '#f8fafc', padding: '0 8px', borderRadius: '10px', border: '1px solid #cbd5e1', flex: '1 1 280px', height: '40px', overflow: 'hidden' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginLeft: '4px', whiteSpace: 'nowrap' }}>Tarih:</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '4px', border: 'none', background: 'transparent', flex: 1, fontSize: '12px', color: '#475569', outline: 'none', minWidth: '10px' }} title="Başlangıç" />
            <span style={{ color: '#cbd5e1' }}>|</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '4px', border: 'none', background: 'transparent', flex: 1, fontSize: '12px', color: '#475569', outline: 'none', minWidth: '10px' }} title="Bitiş" />
          </div>

          {(arama || durumFiltre !== 'hepsi' || startDate || endDate) && (
            <button className="btn-secondary" onClick={() => { setArama(''); setDurumFiltre('hepsi'); setStartDate(''); setEndDate(''); }} style={{ height: '40px', padding: '0 16px' }}>Temizle</button>
          )}
        </div>

        {/* GRAFİKLER */}
        {filtreliHarcamalar.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <section className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
              <h2 style={{ fontSize: '16px', marginBottom: '10px' }}>Kategori Dağılımı</h2>
              <div style={{ flex: 1, minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                      {categoryPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => formatPara(value)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.15)' }} itemStyle={{ fontWeight: 600, color: '#0f172a' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
              <h2 style={{ fontSize: '16px', marginBottom: '10px' }}>Harcama Trendi (Günlük)</h2>
              <div style={{ flex: 1, minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '10px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeBarData} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="5 5" vertical={false} />
                    <XAxis dataKey="tarih" stroke="#64748b" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `${val.toLocaleString('tr-TR')} ₺`} width={70} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => [formatPara(value), 'Tutar']} labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '8px' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.15)' }} cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="tutar" name="Harcama" radius={[4, 4, 0, 0]} fill="#2563eb" barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        )}

        {loading ? (
          <p className="empty">Yükleniyor...</p>
        ) : filtreliHarcamalar.length === 0 ? (
          <p className="empty">Kayıtlı harcama bulunamadı.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Kategori / Tür</th>
                  <th>Açıklama</th>
                  <th>Durum</th>
                  <th style={{ textAlign: 'right' }}>Tutar</th>
                  <th style={{ textAlign: 'center' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtreliHarcamalar.map(h => (
                  <tr key={h.id}>
                    <td style={{ color: 'var(--color-text-light)', fontWeight: 500 }}>{formatTarih(h.tarih)}</td>
                    <td>
                      <strong style={{ display: 'block', fontSize: '14px' }}>{h.kategori}</strong>
                      <span style={{ fontSize: '12.5px', color: 'var(--color-text-light)' }}>{h.tur || '-'}</span>
                    </td>
                    <td style={{ color: 'var(--color-text-light)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {h.aciklama || '—'}
                    </td>
                    <td>
                      {h.durum === 'ödendi' 
                        ? <span className="rozet rozet-success">Ödendi {h.odeme_yontemi ? `(${h.odeme_yontemi})` : ''}</span>
                        : <span className="rozet rozet-warning">Ödenecek</span>}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
                      {formatPara(h.tutar)}
                    </td>
                    <td className="actions-cell" style={{ justifyContent: 'center' }}>
                      <button className="ent-ico-btn" onClick={() => openEdit(h)} title="Düzenle">{ico.edit}</button>
                      <button className="ent-ico-btn danger" onClick={() => sil(h)} title="Sil">{ico.trash}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title={modal.mode === 'new' ? 'Yeni Harcama Kaydı' : 'Harcama Düzenle'}
          subtitle="İşletmenizin giderlerini ve durumunu kaydedin."
          icon="info"
          onClose={() => setModal(null)}
        >
          <form onSubmit={save} className="ys-form">
            <div className="ys-grid-2">
              <div className="ys-field">
                <label>Tutar (TL) <span className="ys-req">*</span></label>
                <input type="number" step="0.01" min="0" required value={form.tutar} onChange={e => setForm({...form, tutar: e.target.value})} style={{ fontWeight: 700, fontSize: '16px' }} />
              </div>
              <div className="ys-field">
                <label>Tarih <span className="ys-req">*</span></label>
                <input type="date" required value={form.tarih} onChange={e => setForm({...form, tarih: e.target.value})} />
              </div>
            </div>

            <div className="ys-grid-2">
              <div className="ys-field">
                <label>Kategori <span className="ys-req">*</span></label>
                <input type="text" list="kategori-listesi" required value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})} placeholder="Örn: Fatura, Malzeme, Reklam" />
                <datalist id="kategori-listesi">
                  {dinamikKategoriler.map(k => <option key={k} value={k} />)}
                </datalist>
              </div>
              <div className="ys-field">
                <label>Tür <span className="ys-req">*</span></label>
                <input type="text" list="tur-listesi" required value={form.tur} onChange={e => setForm({...form, tur: e.target.value})} placeholder="Örn: Elektrik, Deterjan" />
                <datalist id="tur-listesi">
                  {dinamikTurler.map(t => <option key={t} value={t} />)}
                </datalist>
              </div>
            </div>

            <div className="ys-grid-2">
              <div className="ys-field">
                <label>Ödeme Durumu <span className="ys-req">*</span></label>
                <select required value={form.durum} onChange={e => setForm({...form, durum: e.target.value})}>
                  <option value="ödendi">Ödendi</option>
                  <option value="ödenecek">Bekliyor / Ödenecek</option>
                </select>
              </div>
              {form.durum === 'ödendi' && (
                <div className="ys-field">
                  <label>Ödeme Yöntemi <span className="ys-req">*</span></label>
                  <select required value={form.odeme_yontemi} onChange={e => setForm({...form, odeme_yontemi: e.target.value})}>
                    <option value="nakit">Nakit</option>
                    <option value="kart">Kredi Kartı</option>
                    <option value="havale">Havale / EFT</option>
                  </select>
                </div>
              )}
            </div>

            <div className="ys-field" style={{ marginTop: '4px' }}>
              <label>Not / Açıklama <span className="ys-opt">(Opsiyonel)</span></label>
              <textarea rows={2} value={form.aciklama} onChange={e => setForm({...form, aciklama: e.target.value})} placeholder="Harcama ile ilgili notlar veya fatura/fiş numarası..." />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>İptal</button>
              <button type="submit" className="btn-primary">{modal.mode === 'new' ? 'Harcamayı Kaydet' : 'Güncelle'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* KATEGORİ YÖNETİMİ MODALI */}
      {catModalOpen && (
        <Modal title="Kategori ve Tür Yönetimi" subtitle="İşletmenize özel harcama kalemleri oluşturun." icon="info" size="wide" onClose={() => setCatModalOpen(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
            {kategorilerData.map(k => (
              <div key={k.id} style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div className="ys-grid-2" style={{ marginBottom: '12px' }}>
                  <div className="ys-field">
                    <label>Kategori Adı</label>
                    <input type="text" value={k.ad} onChange={(e) => {
                      const yeni = [...kategorilerData];
                      const idx = yeni.findIndex(x => x.id === k.id);
                      yeni[idx].ad = e.target.value;
                      setKategorilerData(yeni);
                    }} />
                  </div>
                  <div className="ys-field">
                    <label>Türler (Virgülle Ayırın)</label>
                    <input type="text" value={(k.turler || []).join(', ')} onChange={(e) => {
                      const yeni = [...kategorilerData];
                      const idx = yeni.findIndex(x => x.id === k.id);
                      yeni[idx].turler = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                      setKategorilerData(yeni);
                    }} placeholder="Örn: Su, Elektrik" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-secondary btn-sm" onClick={() => saveCat(k)}>Değişiklikleri Kaydet</button>
                  <button type="button" className="btn-danger btn-sm" onClick={() => deleteCat(k.id)}>Sil</button>
                </div>
              </div>
            ))}
            
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1.5px dashed #cbd5e1' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1e293b' }}>Yeni Kategori Ekle</h4>
              <div className="ys-grid-2" style={{ marginBottom: '12px' }}>
                <div className="ys-field">
                  <label>Kategori Adı</label>
                  <input type="text" value={newCat.ad} onChange={e => setNewCat({...newCat, ad: e.target.value})} placeholder="Örn: Araç Giderleri" />
                </div>
                <div className="ys-field">
                  <label>Türler (Virgülle Ayırın)</label>
                  <input type="text" value={newCat.turlerText} onChange={e => setNewCat({...newCat, turlerText: e.target.value})} placeholder="Örn: Yakıt, Bakım, Sigorta" />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-primary btn-sm" onClick={createCat}>+ Kategori Ekle</button>
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-primary" onClick={() => setCatModalOpen(false)}>Kapat</button>
          </div>
        </Modal>
      )}

      {errorModal && <ErrorModal baslik={errorModal.baslik} mesaj={errorModal.mesaj} onClose={() => setErrorModal(null)} />}
      {confirmModal && <ConfirmModal {...confirmModal} onClose={() => setConfirmModal(null)} />}
    </section>
  )
}