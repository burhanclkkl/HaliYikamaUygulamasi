import { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import ErrorModal from './ErrorModal'
import ConfirmModal from './ConfirmModal'
import Modal from './Modal'
import { formatPara, formatTelefon, formatTarih, getCleanPhoneNumber } from '../utils/helpers'

const DURUM_LABELS = {
  // Eski kayıtların görünüm uyumluluğu
  alindi: 'Teslim Alındı',
  temizleniyor: 'Yıkanıyor',
  hazir: 'Paketlendi',
  // Yeni 6 aşamalı sistem
  teslim_alindi: 'Teslim Alındı',
  yikaniyor: 'Yıkanıyor',
  kurulaniyor: 'Kurulanıyor',
  paketlendi: 'Paketlendi',
  teslimata_cikti: 'Teslimata Çıktı',
  teslim_edildi: 'Teslim Edildi'
}

const DURUM_OPTIONS = ['teslim_alindi', 'yikaniyor', 'kurulaniyor', 'paketlendi', 'teslimata_cikti', 'teslim_edildi']

const DurumIkon = ({ durum }) => {
  // Durum eşleştirmesi (Eski durumları yeni tasarıma otomatik bağlar)
  const d = durum === 'alindi' ? 'teslim_alindi' : 
            durum === 'temizleniyor' ? 'yikaniyor' : 
            durum === 'hazir' ? 'paketlendi' : durum;

  switch(d) {
    case 'teslim_alindi':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
    case 'yikaniyor':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><circle cx="12" cy="14" r="4"></circle></svg>;
    case 'kurulaniyor':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path></svg>;
    case 'paketlendi':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>;
    case 'teslimata_cikti':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>;
    case 'teslim_edildi':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
    default:
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
  }
}

// Siparişin durumuna göre otomatik WhatsApp mesajı oluşturan fonksiyon
const getStatusMessage = (s) => {
  const musteriAd = s.musteri_ad || 'Değerli Müşterimiz';
  
  // Eğer siparişin durumu null veya boş ise (yeni sipariştir), otomatik "teslim_alindi" kabul et
  let rawDurum = s.durum || 'teslim_alindi';
  if (rawDurum === 'alindi') rawDurum = 'teslim_alindi';
  if (rawDurum === 'temizleniyor') rawDurum = 'yikaniyor';
  if (rawDurum === 'hazir') rawDurum = 'paketlendi';

  const durum = String(rawDurum).toLowerCase().trim();

  // Modern Sözlük (Lookup Object) Yaklaşımı
  const mesajlar = {
    teslim_alindi: `Merhaba ${musteriAd},\n\nHalılarınız adresinizden güvenle teslim alınmıştır. Sipariş süreciniz başlamış olup, bir sonraki aşamada yıkama işlemine alınacaktır.\n\nBizi tercih ettiğiniz için teşekkür eder, iyi günler dileriz!`,
    yikaniyor: `Merhaba ${musteriAd},\n\nHalılarınız şu anda derinlemesine temizlik için profesyonel makinelerimizde yıkanıyor! Hijyenik ve tertemiz bir şekilde özenle hazırlanıyorlar.\n\nEn kısa sürede kurutma aşamasına geçilecektir.`,
    kurulaniyor: `Merhaba ${musteriAd},\n\nHalılarınızın yıkama işlemi tamamlandı! Şu anda özel kurutma odalarımızda kurulanıyor.\n\nNemden tamamen arındırıldıktan sonra özenle paketleme aşamasına geçilecektir.`,
    paketlendi: `Merhaba ${musteriAd},\n\nHalılarınız pırıl pırıl yıkandı, kurulandı ve hijyen kurallarına uygun olarak parfümlenip paketlendi!\n\nŞu anda dağıtım merkezimizde teslimat sırasına alınmayı bekliyor.`,
    teslimata_cikti: `Merhaba ${musteriAd},\n\nMüjde! Halılarınız tertemiz bir şekilde teslim edilmek üzere kurye aracımızla yola çıktı.\n\nKısa süre içinde adresinizde olacağız. Lütfen teslimat için adreste olmaya özen gösteriniz.`,
    teslim_edildi: `Merhaba ${musteriAd},\n\nHalılarınız adresinize başarıyla teslim edilmiştir. Tertemiz halılarınızı güzel günlerde, sağlıkla kullanmanızı dileriz.\n\nBizi tercih ettiğiniz için teşekkür ederiz!`
  };

  // Eğer durum sözlükte varsa ilgili mesajı dön
  if (mesajlar[durum]) {
    return mesajlar[durum];
  }

  // Sözlükte eşleşmeyen veya tanımsız durumlar için güvenli yedek (fallback)
  const durumEtiketi = (typeof DURUM_LABELS !== 'undefined' && DURUM_LABELS[rawDurum]) || rawDurum || 'Bilinmiyor';
  return `Merhaba ${musteriAd},\n\nSiparişinizin güncel durumu: *${durumEtiketi}*.\n\nBizi tercih ettiğiniz için teşekkür ederiz!`;
}

function kalanGunRozet(kalan_gun, durum) {
  if (durum === 'teslim_edildi') return { text: 'Tamamlandı', cls: 'rozet-success' }
  if (kalan_gun == null) return { text: 'Tarihsiz', cls: 'rozet-gri' }
  if (kalan_gun < 0) return { text: `${Math.abs(kalan_gun)} gün geçti`, cls: 'rozet-warning' }
  if (kalan_gun === 0) return { text: 'Bugün teslim', cls: 'rozet-acil' }
  if (kalan_gun <= 2) return { text: `${kalan_gun} gün kaldı`, cls: 'rozet-acil' }
  return { text: `${kalan_gun} gün kaldı`, cls: 'rozet-info' }
}

export default function OrdersTab() {
  // ========== TUM STATE'LER ==========
  const [siparisler, setSiparisler] = useState([])
  const [musteriler, setMusteriler] = useState([])
  const [loading, setLoading] = useState(true)
  const [arama, setArama] = useState('')
  const [durumFiltre, setDurumFiltre] = useState('hepsi')
  
  const [siparisTarihiBas, setSiparisTarihiBas] = useState('')
  const [siparisTarihiBit, setSiparisTarihiBit] = useState('')
  const [teslimTarihiBas, setTeslimTarihiBas] = useState('')
  const [teslimTarihiBit, setTeslimTarihiBit] = useState('')

  const [yeniModal, setYeniModal] = useState(false)
  const [yeniForm, setYeniForm] = useState({
    customer_id: '',
    customer_search: '',
    irsaliye_no: '',
    teslim_tarihi: '',
    items: [{ hali_tipi: '', en: '', boy: '', m2_fiyat: '' }]
  })

  const [odemeModal, setOdemeModal] = useState(null)
  const [odemeForm, setOdemeForm] = useState({ tutar: '', odeme_turu: 'nakit', aciklama: '' })
  const [odemeler, setOdemeler] = useState([])
  const [carpetTypes, setCarpetTypes] = useState([]); // Yeni: Halı tipleri state'i
  
  // Hata ve Onay Modalları
  const [errorModal, setErrorModal] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  // ========== EFFECTS ==========
  useEffect(() => {
    initiData()
  }, []);

  const initiData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadOrders(), loadMusteriler(), loadCarpetTypes()]); // Halı tiplerini de yükle
    } catch (err) {
      setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Veriler yüklenirken bir hata oluştu.' })
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    try {
      const res = await api.get('/orders')
      // Backend api direkt array dönüyor olabilir veya obje içinde array dönüyor olabilir. İkisini de kapsayalım:
      if (Array.isArray(res.data)) {
        setSiparisler(res.data)
      } else {
        setSiparisler(res.data.siparisler || [])
      }
    } catch (err) {
      setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Siparişler yüklenirken bir hata oluştu.' })
    }
  }

  const loadMusteriler = async () => {
    try {
      const res = await api.get('/customers')
      if (Array.isArray(res.data)) {
        setMusteriler(res.data)
      } else {
        setMusteriler(res.data.musteriler || [])
      }
    } catch (err) {
      setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Müşteriler yüklenirken bir hata oluştu.' })
    }
  }

  // Yeni: Halı tiplerini yükleme fonksiyonu
  const loadCarpetTypes = async () => {
    try {
      const res = await api.get('/carpet_types');
      setCarpetTypes(res.data);
    } catch (err) {
      setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Halı tipleri yüklenirken bir hata oluştu.' });
    }
  };

  // Yeni: Halı tipi seçildiğinde m2 fiyatını otomatik doldur
  const handleHaliTipiChange = (idx, value) => {
    const selectedType = carpetTypes.find(ct => ct.name === value);
    const yeni = [...yeniForm.items];
    yeni[idx] = { ...yeni[idx], hali_tipi: value };
    // Sadece tanımlı bir tip seçilirse fiyatı doldur
    yeni[idx].m2_fiyat = selectedType ? selectedType.price_per_m2 : '';
    setYeniForm({ ...yeniForm, items: yeni });
  }

  const load = async () => {
    setLoading(true)
    await loadOrders()
    setLoading(false)
  }

  // ========== DURUM, SIL, PDF ==========
  const updateDurum = async (siparis, yeniDurum) => {
    if (yeniDurum === siparis.durum) return
    try {
      await api.put(`/orders/${siparis.id}/durum`, { durum: yeniDurum })
      loadOrders()
    } catch (err) {
      setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Sipariş durumu güncellenemedi.' })
    }
  }

  const sil = async (s) => {
    setConfirmModal({
      baslik: "Sipariş Sil",
      mesaj: `#${s.id} numaralı siparişi silmek istediğinize emin misiniz?`,
      onConfirm: async () => {
        try {
          await api.delete(`/orders/${s.id}`)
          setConfirmModal(null)
          loadOrders()
        } catch (err) {
          setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Sipariş silinirken bir hata oluştu.' })
        }
      }
    })
  }

  const indirPDF = async (s) => {
    try {
      const res = await api.get(`/orders/${s.id}/pdf`, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      // PDF'i yeni sekmede blob url olarak aç
      window.open(url, '_blank')
      
      // Bellek sızıntısını önlemek için bir süre sonra URL'i temizle
      setTimeout(() => window.URL.revokeObjectURL(url), 10000)
    } catch (err) {
      // blob yanıtlarında hatayı yakalamak için okumak gerekir
      if (err.response?.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            setErrorModal({ baslik: "Yetki Hatası", mesaj: errorData.hata || "PDF oluşturulamadı." });
          } catch (e) {
            setErrorModal({ baslik: "Hata", mesaj: "PDF indirilemedi." });
          }
        };
        reader.readAsText(err.response.data);
      } else {
        setErrorModal({ baslik: "Hata", mesaj: "Sunucu hatası oluştu." });
      }
    }
  }

  const iletPDF = async (s) => {
    try {
      const res = await api.get(`/orders/${s.id}/pdf`, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const filename = `irsaliye-${s.irsaliye_no || s.id}.pdf`
      const file = new File([blob], filename, { type: 'application/pdf' })

      // Modern Tarayıcı / Mobil Cihaz Paylaşım Desteği
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Sipariş İrsaliyesi',
            text: `Merhaba ${s.musteri_ad || ''}, siparişinize ait irsaliye ektedir. Bizi tercih ettiğiniz için teşekkür ederiz!`
          })
          return; // Paylaşım başarılıysa işlemi bitir
        } catch (shareErr) {
          // Kullanıcı paylaşım menüsünü iptal ettiyse sessizce çık
          if (shareErr.name === 'AbortError') return;
        }
      }

      // Fallback (Desteklenmeyen tarayıcılar için): Dosyayı indir ve WhatsApp Web'i aç
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => window.URL.revokeObjectURL(url), 10000)

      const waText = encodeURIComponent(`Merhaba ${s.musteri_ad || ''}, siparişinize ait irsaliye ektedir.\n\n*(Lütfen az önce indirilen "${filename}" adlı PDF dosyasını bu sohbete sürükleyerek ekleyin)*`);
      window.open(`https://api.whatsapp.com/send?phone=${getCleanPhoneNumber(s.musteri_telefon)}&text=${waText}`, '_blank');
      
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        setErrorModal({ baslik: "Hata", mesaj: "İrsaliye oluşturulurken bir sorun yaşandı." });
      } else {
        setErrorModal({ baslik: "Hata", mesaj: "Sunucu bağlantı hatası." });
      }
    }
  }

  // ========== YENI SIPARIS ==========
  const openYeni = () => {
    setYeniForm({
      customer_id: '',
      customer_search: '',
      irsaliye_no: '',
      teslim_tarihi: '',
      items: [{ hali_tipi: '', en: '', boy: '', m2_fiyat: '' }]
    })
    setYeniModal(true)
  }

  const updateItem = (idx, field, value) => {
    const yeni = [...yeniForm.items]
    yeni[idx] = { ...yeni[idx], [field]: value }
    setYeniForm({ ...yeniForm, items: yeni })
  }

  const addItem = () => {
    setYeniForm({
      ...yeniForm,
      items: [...yeniForm.items, { hali_tipi: '', en: '', boy: '', m2_fiyat: '' }]
    })
  }

  const removeItem = (idx) => {
    if (yeniForm.items.length === 1) return
    setYeniForm({
      ...yeniForm,
      items: yeniForm.items.filter((_, i) => i !== idx)
    })
  }

  const hesaplaItem = (item) => {
    // Kullanıcı virgül kullanırsa noktaya çevir ki JS sayı olarak algılasın
    const parseSafe = (val) => {
      if (!val) return 0
      return parseFloat(String(val).replace(',', '.')) || 0
    }
    
    const en = parseSafe(item.en)
    const boy = parseSafe(item.boy)
    const fiyat = parseSafe(item.m2_fiyat)
    const m2 = en * boy
    const tutar = m2 * fiyat
    return { m2, tutar }
  }

  const yeniSiparisToplam = yeniForm.items.reduce((acc, it) => acc + hesaplaItem(it).tutar, 0)

  const saveYeni = async (e) => {
    e.preventDefault()

    if (!yeniForm.customer_id) {
      setErrorModal({ baslik: "Eksik Alan", mesaj: "Lütfen bir müşteri seçin." })
      return
    }

    const parseSafe = (val) => {
      if (!val) return 0
      return parseFloat(String(val).replace(',', '.')) || 0
    }

    let hasError = false;
    const validItems = yeniForm.items.map(it => {
      const en = parseSafe(it.en);
      const boy = parseSafe(it.boy);
      const m2_fiyat = parseSafe(it.m2_fiyat);
      
      // Halı tipi seçilmemişse veya ölçüler 0 ise hata ver
      if (it.hali_tipi.trim() === '' || en <= 0 || boy <= 0 || m2_fiyat <= 0) {
        hasError = true;
      }
      
      return { hali_tipi: it.hali_tipi, en, boy, m2_fiyat };
    });

    // Herhangi bir satırda hata varsa veya hiç halı yoksa işlemi durdur
    if (hasError || validItems.length === 0) {
      setErrorModal({ baslik: "Eksik Bilgi", mesaj: "Lütfen eklediğiniz tüm halıların tipini seçin ve en, boy, fiyat alanlarını 0'dan büyük olacak şekilde doldurun." })
      return
    }

    try {
      await api.post('/orders', {
        customer_id: parseInt(yeniForm.customer_id),
        irsaliye_no: yeniForm.irsaliye_no || null,
        teslim_tarihi: yeniForm.teslim_tarihi || null,
        items: validItems.map(it => ({
          hali_tipi: it.hali_tipi,
          en: parseSafe(it.en),
          boy: parseSafe(it.boy),
          m2_fiyat: parseSafe(it.m2_fiyat)
        }))
      })
      setYeniModal(false)
      loadOrders()
    } catch (err) {
      setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Sipariş oluşturulamadı.' })
    }
  }

  // ========== ODEME ==========
  const openOdeme = async (siparis) => {
    try {
      const res = await api.get(`/orders/${siparis.id}/payments`)
      setOdemeler(res.data.odemeler || [])
      setOdemeForm({ tutar: '', odeme_turu: 'nakit', aciklama: '' })
      setOdemeModal({ ...siparis, ...res.data })
    } catch (err) {
      setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Ödemeler yüklenirken bir hata oluştu.' })
    }
  }

  const saveOdeme = async (e) => {
    e.preventDefault()
    
    const parseSafe = (val) => {
      if (!val) return 0
      return parseFloat(String(val).replace(',', '.')) || 0
    }

    const tutar = parseSafe(odemeForm.tutar);
    if (tutar <= 0) {
      setErrorModal({ baslik: "Geçersiz Tutar", mesaj: "Ödeme tutarı 0'dan büyük olmalıdır." });
      return;
    }
    if (tutar > odemeModal.kalan) {
      setErrorModal({ baslik: "Hata", mesaj: "Ödeme tutarı, kalan borçtan büyük olamaz." });
      return;
    }
    try {
      await api.post(`/orders/${odemeModal.id}/payments`, {
        tutar: tutar,
        odeme_turu: odemeForm.odeme_turu,
        aciklama: odemeForm.aciklama || null
      })
      const res = await api.get(`/orders/${odemeModal.id}/payments`)
      setOdemeler(res.data.odemeler || [])
      setOdemeModal({ ...odemeModal, ...res.data })
      setOdemeForm({ tutar: '', odeme_turu: 'nakit', aciklama: '' })
      loadOrders()
    } catch (err) { // Hata durumunda pop-up göster
      setErrorModal({ baslik: "Hata", mesaj: err.response?.data?.hata || 'Ödeme eklenemedi.' })
    }
  }

  const silOdeme = async (pid) => { // Confirm modal ile değiştir
    setConfirmModal({
      baslik: "Ödeme Sil",
      mesaj: "Bu ödemeyi silmek istediğinize emin misiniz?",
      onConfirm: async () => {
        setConfirmModal(null)
        try {
          await api.delete(`/orders/${odemeModal.id}/payments/${pid}`)
          const res = await api.get(`/orders/${odemeModal.id}/payments`)
          setOdemeler(res.data.odemeler || [])
          setOdemeModal({ ...odemeModal, ...res.data })
          loadOrders()
        } catch (err) {
          setErrorModal({ baslik: "Hata", mesaj: 'Ödeme silinemedi.' })
        }
      }
    })
  }

/*
  const silOdeme = async (pid) => {
    if (!confirm('Bu ödemeyi silmek istediğinize emin misiniz?')) return
    try {
      await api.delete(`/orders/${odemeModal.id}/payments/${pid}`)
      const res = await api.get(`/orders/${odemeModal.id}/payments`)
      setOdemeler(res.data.odemeler || [])
      setOdemeModal({ ...odemeModal, ...res.data })
      loadOrders()
    } catch (err) {
      alert('Silme başarısız')
    }
  }*/

// ========== FILTRELEME (TAM GÜVENLİ VE KESİN ÇÖZÜM) ==========
  const filtreli = useMemo(() => {
    const aramaLower = (arama || '').toLocaleLowerCase('tr-TR').trim();
    return siparisler.filter(s => {
    if (!s) return false;

    // Durum kontrolü (Null-safe ve string korumalı)
    const siparisDurum = (s.durum || '').trim();
    if (durumFiltre === 'gecikenler') {
      if (!(s.kalan_gun != null && s.kalan_gun < 0 && siparisDurum !== 'teslim_edildi')) {
        return false;
      }
    } else if (durumFiltre !== 'hepsi' && siparisDurum !== durumFiltre) {
      return false;
    }

    // Sipariş Tarihi Filtresi
    if (siparisTarihiBas || siparisTarihiBit) {
      if (!s.created_at) return false;
      const sTarih = s.created_at.split('T')[0];
      if (siparisTarihiBas && sTarih < siparisTarihiBas) return false;
      if (siparisTarihiBit && sTarih > siparisTarihiBit) return false;
    }

    // Teslim Tarihi Filtresi
    if (teslimTarihiBas || teslimTarihiBit) {
      if (!s.teslim_tarihi) return false;
      const tTarih = s.teslim_tarihi.split('T')[0];
      if (teslimTarihiBas && tTarih < teslimTarihiBas) return false;
      if (teslimTarihiBit && tTarih > teslimTarihiBit) return false;
    }

    // Eğer arama kutusu boşsa direkt göster
    if (!aramaLower) return true;

    // Arama filtre elemanlarını güvenli hale getir
    const musteri = (s.musteri_ad || '').toLocaleLowerCase('tr-TR');
    const tel = (s.musteri_telefon || '').replace(/\D/g, '');
    const irs = (s.irsaliye_no || '').toLocaleLowerCase('tr-TR');
    const aramaTel = aramaLower.replace(/\D/g, '');

    return (
      musteri.includes(aramaLower) ||
      irs.includes(aramaLower) ||
      (aramaTel && tel.includes(aramaTel))
    );
    });
  }, [siparisler, arama, durumFiltre, siparisTarihiBas, siparisTarihiBit, teslimTarihiBas, teslimTarihiBit]);

  // Yeni sipariş modalı için müşteri arama filtresi (Güçlendirilmiş)
  const filteredMusterilerForNewOrder = useMemo(() => {
    return musteriler.filter(m => {
    const s = yeniForm.customer_search.toLocaleLowerCase('tr-TR').trim()
    if (!s) return false
    
    const target = `${m.ad} ${m.soyad} ${m.telefon || ''}`.toLocaleLowerCase('tr-TR')
    const kelimeler = s.split(/\s+/) // Boşluklara göre böl
    
    // Her kelime müşteri bilgisinde var mı bak
    return kelimeler.every(k => target.includes(k))
    });
  }, [musteriler, yeniForm.customer_search]);

  return (
    <section className="card">
      <div className="card-header">
        <h2>Siparişler ({filtreli.length}{arama && `/${siparisler.length}`})</h2>
        <button className="btn-primary" onClick={openYeni}>+ Yeni Sipariş</button>
      </div>

<div className="filter-row" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
  <div className="search-bar" style={{ flex: '1 1 250px', marginBottom: 0 }}>
    <input
      type="text"
      placeholder="Müşteri, telefon veya irsaliye no ile ara..."
      value={arama}
      onChange={(e) => setArama(e.target.value)}
      style={{ padding: '10px 16px', width: '100%' }}
    />
    {arama && <button className="search-clear" onClick={() => setArama('')}>✕</button>}
  </div>
  <select
    value={durumFiltre}
    onChange={(e) => setDurumFiltre(e.target.value)}
    className="durum-filtre" 
    style={{ flex: '1 1 150px', padding: '0 12px', height: '40px' }}
  >
      <option value="hepsi">Tüm Durumlar</option>
      <option value="gecikenler">⚠️ Geciken Siparişler</option>
  <option value="teslim_alindi">Teslim Alındı</option>
  <option value="yikaniyor">Yıkanıyor</option>
  <option value="kurulaniyor">Kurulanıyor</option>
  <option value="paketlendi">Paketlendi</option>
  <option value="teslimata_cikti">Teslimata Çıktı</option>
  <option value="teslim_edildi">Teslim Edildi</option>
  </select>

  {/* Tarih Filtreleri */}
  <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap', alignItems: 'center', backgroundColor: '#f8fafc', padding: '0 8px', borderRadius: '10px', border: '1px solid #cbd5e1', flex: '1 1 280px', height: '40px', overflow: 'hidden' }}>
    <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginLeft: '4px', whiteSpace: 'nowrap' }}>Sipariş:</span>
    <input type="date" value={siparisTarihiBas} onChange={(e) => setSiparisTarihiBas(e.target.value)} style={{ padding: '4px', border: 'none', background: 'transparent', flex: 1, fontSize: '12px', color: '#475569', outline: 'none', minWidth: '10px' }} title="Başlangıç" />
    <span style={{ color: '#cbd5e1' }}>|</span>
    <input type="date" value={siparisTarihiBit} onChange={(e) => setSiparisTarihiBit(e.target.value)} style={{ padding: '4px', border: 'none', background: 'transparent', flex: 1, fontSize: '12px', color: '#475569', outline: 'none', minWidth: '10px' }} title="Bitiş" />
  </div>

  <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap', alignItems: 'center', backgroundColor: '#f8fafc', padding: '0 8px', borderRadius: '10px', border: '1px solid #cbd5e1', flex: '1 1 280px', height: '40px', overflow: 'hidden' }}>
    <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginLeft: '4px', whiteSpace: 'nowrap' }}>Teslim:</span>
    <input type="date" value={teslimTarihiBas} onChange={(e) => setTeslimTarihiBas(e.target.value)} style={{ padding: '4px', border: 'none', background: 'transparent', flex: 1, fontSize: '12px', color: '#475569', outline: 'none', minWidth: '10px' }} title="Başlangıç" />
    <span style={{ color: '#cbd5e1' }}>|</span>
    <input type="date" value={teslimTarihiBit} onChange={(e) => setTeslimTarihiBit(e.target.value)} style={{ padding: '4px', border: 'none', background: 'transparent', flex: 1, fontSize: '12px', color: '#475569', outline: 'none', minWidth: '10px' }} title="Bitiş" />
  </div>

  {/* Temizle Butonu */}
  {(siparisTarihiBas || siparisTarihiBit || teslimTarihiBas || teslimTarihiBit || arama || durumFiltre !== 'hepsi') && (
    <button className="btn-secondary" onClick={() => {
      setArama(''); setDurumFiltre('hepsi'); setSiparisTarihiBas(''); setSiparisTarihiBit(''); setTeslimTarihiBas(''); setTeslimTarihiBit('');
    }} style={{ height: '40px', padding: '0 16px' }}>Temizle</button>
  )}

      </div>

      {loading ? (
        <p className="empty">Yükleniyor...</p>
      ) : filtreli.length === 0 ? (
        <p className="empty">
          {arama || durumFiltre !== 'hepsi'
            ? 'Filtreye uygun sipariş bulunamadı.'
            : 'Henüz sipariş yok.'}
        </p>
      ) : (
        <div className="orders-list">
          {filtreli.map(s => {
            const rozet = kalanGunRozet(s.kalan_gun, s.durum)
            const tamamenOdendi = s.tamamen_odendi
            const isOverdue = s.kalan_gun != null && s.kalan_gun < 0 && s.durum !== 'teslim_edildi';
            
            // Eski durumları da görsel için yeni durumlara yönlendir
            const visualDurum = s.durum === 'alindi' ? 'teslim_alindi' : 
                                s.durum === 'temizleniyor' ? 'yikaniyor' : 
                                s.durum === 'hazir' ? 'paketlendi' : s.durum;

            return (
              <div key={s.id} className={`modern-order-card border-${visualDurum} ${isOverdue ? 'overdue-card' : ''}`}>
                <div className="modern-order-body">
                  
                  {/* BÖLÜM A: Müşteri & Lokasyon */}
                  <div className="order-col-a">
                    <div className="col-header-row">
                      <span className="modern-id">#{s.id} {s.irsaliye_no && `· ${s.irsaliye_no}`}</span>
                      <span className={`rozet ${rozet.cls}`}>{rozet.text}</span>
                    </div>
                    <h3 className="modern-customer-name">{s.musteri_ad || 'Bilinmiyor'}</h3>
                    <div className="modern-customer-phone" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      {s.musteri_telefon ? formatTelefon(s.musteri_telefon) : '—'}
                    </div>
                    
                    <div className="modern-map-area">
                      {s.musteri_adres ? (
                        <>
                          <span className="address-trunc" title={s.musteri_adres}>{s.musteri_adres}</span>
                          <a className="modern-map-btn" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.musteri_adres)}`} target="_blank" rel="noopener noreferrer">
                            Konuma Git ↗
                          </a>
                        </>
                      ) : <span className="address-trunc">Adres girilmemiş</span>}
                    </div>
                  </div>

                  {/* BÖLÜM B: Finans & İçerik */}
                  <div className="order-col-b">
                    <div className="modern-items-box">
                      <strong>Sipariş Bilgisi</strong>
                      {s.items && s.items.length > 0 ? (
                        <ul className="modern-hali-listesi">
                          {s.items.map((it) => (
                            <li key={it.id}>
                              <span className="hali-adi">{it.hali_tipi}</span>
                              <span className="hali-m2">{Number(it.m2).toFixed(2)} m²</span>
                            </li>
                          ))}
                        </ul>
                      ) : <p>Halı bilgisi yok</p>}
                    </div>
                    <div className="modern-finance-box">
                      <div className="fin-row"><span>Toplam</span> <strong>{formatPara(s.toplam_tutar)}</strong></div>
                      <div className="fin-row"><span>Ödenen</span> <strong style={{color: '#10b981'}}>{formatPara(s.odenen)}</strong></div>
                      <div className="fin-row" style={{border: 'none', paddingBottom: 0}}>
                        <span>Kalan</span> 
                        <strong className={tamamenOdendi ? 'fin-tamam' : 'fin-kalan'}>
                          {tamamenOdendi ? 'Ödendi ✓' : formatPara(s.kalan)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* BÖLÜM C: Gelişmiş Durum Paneli */}
                  <div className="order-col-c">
                    <div className="status-panel-container">
                      <div className="status-panel-title">GÜNCEL DURUM</div>
                      <div className={`status-big-icon bg-${visualDurum}`}>
                        <DurumIkon durum={visualDurum} />
                      </div>
                      <div className={`status-big-text text-${visualDurum}`}>{DURUM_LABELS[visualDurum]}</div>
                      
                      <select
                        value={visualDurum}
                        onChange={(e) => updateDurum(s, e.target.value)}
                        className={`status-dropdown-modern bg-${visualDurum}`}
                      >
                        {DURUM_OPTIONS.map(d => (
                          <option key={d} value={d}>{DURUM_LABELS[d]}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                </div>

                {/* Alt Aksiyon Çubuğu */}
                <div className="modern-order-footer">
                  <div className="modern-actions">
                    <a href={`https://api.whatsapp.com/send?phone=${getCleanPhoneNumber(s.musteri_telefon)}&text=${encodeURIComponent(`Merhaba ${s.musteri_ad || ''}, `)}`} target="_blank" rel="noopener noreferrer" className="btn-modern-action wa">
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                      WhatsApp
                    </a>
                    <a href={`https://api.whatsapp.com/send?phone=${getCleanPhoneNumber(s.musteri_telefon)}&text=${encodeURIComponent(getStatusMessage(s))}`} target="_blank" rel="noopener noreferrer" className="btn-modern-action wa-status">
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path></svg>
                      Durum İlet
                    </a>
                    <button className="btn-modern-action pdf" onClick={() => indirPDF(s)}>
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      İrsaliye
                    </button>
                    <button className="btn-modern-action pdf-ilet" onClick={() => iletPDF(s)}>
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                      İrsaliye İlet
                    </button>
                    <button className="btn-modern-action pay" onClick={() => openOdeme(s)}>
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                      Ödeme
                    </button>
                    <button className="btn-modern-action del" onClick={() => sil(s)}>
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      Sil
                    </button>
                  </div>
                  <div className="modern-dates">
                    Sipariş: {s.created_at ? new Date(s.created_at).toLocaleString('tr-TR', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'}) : '—'}
                    {s.teslim_tarihi && <span> · Teslim: {formatTarih(s.teslim_tarihi)}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* YENI SIPARIS MODAL */}
      {yeniModal && (
        <Modal title="Yeni Sipariş" subtitle="Müşteri seçin, halıları ve ölçüleri girin." icon="info" size="wide" onClose={() => setYeniModal(false)}>
            <form onSubmit={saveYeni} className="ys-form">

              {/* ---- MÜŞTERİ ---- */}
              <div className="ys-section">
                <label className="ys-label">Müşteri <span className="ys-req">*</span></label>

                {yeniForm.customer_id ? (
                  /* Seçili müşteri kartı — arama kapanır, açılır liste binmesi olmaz */
                  (() => {
                    const secili = musteriler.find(m => m.id === yeniForm.customer_id)
                    const adSoyad = secili ? `${secili.ad} ${secili.soyad}` : yeniForm.customer_search
                    return (
                      <div className="ys-customer-chip">
                        <div className="ys-customer-avatar">{(adSoyad.trim()[0] || '?').toLocaleUpperCase('tr-TR')}</div>
                        <div className="ys-customer-meta">
                          <strong>{adSoyad}</strong>
                          {secili?.telefon && <span>{formatTelefon(secili.telefon)}</span>}
                        </div>
                        <button
                          type="button"
                          className="ys-customer-change"
                          onClick={() => setYeniForm({ ...yeniForm, customer_id: '', customer_search: '' })}
                        >
                          Değiştir
                        </button>
                      </div>
                    )
                  })()
                ) : (
                  <div className="ys-search">
                    <svg className="ys-search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                      type="text"
                      className="ys-search-input"
                      placeholder="Müşteri adı veya telefon ile ara..."
                      value={yeniForm.customer_search}
                      onChange={(e) => setYeniForm({ ...yeniForm, customer_search: e.target.value, customer_id: '' })}
                      autoComplete="off"
                    />
                    {yeniForm.customer_search && (
                      <button
                        type="button"
                        className="ys-search-clear"
                        onClick={() => setYeniForm({ ...yeniForm, customer_search: '', customer_id: '' })}
                        aria-label="Temizle"
                      >✕</button>
                    )}

                    {/* Arama sonuçları (floating) */}
                    {yeniForm.customer_search.trim() !== '' && (
                      <div className="ys-search-results">
                        {filteredMusterilerForNewOrder.length > 0 ? (
                          filteredMusterilerForNewOrder.slice(0, 8).map(m => (
                            <button
                              type="button"
                              key={m.id}
                              className="ys-search-item"
                              onClick={() => setYeniForm({
                                ...yeniForm,
                                customer_id: m.id,
                                customer_search: `${m.ad} ${m.soyad}`
                              })}
                            >
                              <span className="ys-search-item-name">{m.ad} {m.soyad}</span>
                              <span className="ys-search-item-phone">{formatTelefon(m.telefon)}</span>
                            </button>
                          ))
                        ) : (
                          <div className="ys-search-empty">Eşleşen müşteri bulunamadı</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ---- META: İrsaliye + Teslim ---- */}
              <div className="ys-grid-2">
                <div className="ys-field">
                  <label className="ys-label">İrsaliye No <span className="ys-opt">(opsiyonel)</span></label>
                  <input
                    type="text"
                    value={yeniForm.irsaliye_no}
                    onChange={(e) => setYeniForm({ ...yeniForm, irsaliye_no: e.target.value })}
                    placeholder="Boş bırakılırsa otomatik üretilir"
                    className={!yeniForm.irsaliye_no ? 'input-auto-gen' : ''}
                  />
                </div>
                <div className="ys-field">
                  <label className="ys-label">Teslim Tarihi <span className="ys-opt">(opsiyonel)</span></label>
                  <input
                    type="date"
                    value={yeniForm.teslim_tarihi}
                    onChange={(e) => setYeniForm({ ...yeniForm, teslim_tarihi: e.target.value })}
                  />
                </div>
              </div>

              {/* ---- HALILAR ---- */}
              <div className="ys-section">
                <div className="ys-section-head">
                  <label className="ys-label" style={{ margin: 0 }}>Halılar</label>
                  {carpetTypes.length > 0 && (
                    <span className="ys-count">{yeniForm.items.length} kalem</span>
                  )}
                </div>

                {carpetTypes.length === 0 ? (
                  /* Boş durum — halı tipi yoksa yönlendir, kaydetmeyi engelle */
                  <div className="ys-empty">
                    <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                    <p className="ys-empty-title">Henüz halı tipi tanımlamadınız</p>
                    <span className="ys-empty-text">Sipariş oluşturabilmek için önce <strong>Halı Tipleri</strong> sekmesinden en az bir tip ve m² fiyatı ekleyin.</span>
                  </div>
                ) : (
                  <>
                    <div className="ys-hali-list">
                      {yeniForm.items.map((item, idx) => {
                        const { m2, tutar } = hesaplaItem(item)
                        return (
                          <div key={idx} className="ys-hali-card">
                            <div className="ys-hali-index">{idx + 1}</div>
                            <div className="ys-hali-fields">
                              <div className="ys-field ys-field-tip">
                                <label>Halı Tipi</label>
                                <select
                                  value={item.hali_tipi}
                                  onChange={(e) => handleHaliTipiChange(idx, e.target.value)}
                                  required
                                >
                                  <option value="" disabled>Seçiniz</option>
                                  {carpetTypes.map(ct => (
                                    <option key={ct.id} value={ct.name}>{ct.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="ys-field">
                                <label>En (m)</label>
                                <input type="number" placeholder="0" step="0.01" min="0" inputMode="decimal"
                                  value={item.en} onChange={(e) => updateItem(idx, 'en', e.target.value)} />
                              </div>
                              <div className="ys-field">
                                <label>Boy (m)</label>
                                <input type="number" placeholder="0" step="0.01" min="0" inputMode="decimal"
                                  value={item.boy} onChange={(e) => updateItem(idx, 'boy', e.target.value)} />
                              </div>
                              <div className="ys-field">
                                <label>m² Fiyat</label>
                                <input type="number" placeholder="0" step="any" min="0.01" inputMode="decimal"
                                  value={item.m2_fiyat} onChange={(e) => updateItem(idx, 'm2_fiyat', e.target.value)} />
                              </div>
                            </div>
                            <div className="ys-hali-foot">
                              <div className="ys-hali-calc">
                                <span className="ys-chip ys-chip-m2">{m2.toFixed(2)} m²</span>
                                <span className="ys-chip ys-chip-tutar">{formatPara(tutar)}</span>
                              </div>
                              {yeniForm.items.length > 1 && (
                                <button type="button" className="ys-hali-remove" onClick={() => removeItem(idx)} aria-label="Halıyı kaldır">
                                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <button type="button" className="ys-add-btn" onClick={addItem}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Halı Ekle
                    </button>
                  </>
                )}
              </div>

              {/* ---- TOPLAM ---- */}
              <div className="ys-total">
                <span>Genel Toplam</span>
                <strong>{formatPara(yeniSiparisToplam)}</strong>
              </div>

              {/* ---- AKSİYONLAR ---- */}
              <div className="ys-actions">
                <button type="button" className="btn-secondary" onClick={() => setYeniModal(false)}>
                  İptal
                </button>
                <button type="submit" className="btn-primary" disabled={carpetTypes.length === 0}>
                  Siparişi Oluştur
                </button>
              </div>
            </form>
        </Modal>
      )}

      {/* ODEME MODAL */}
      {odemeModal && (
        <Modal title="Ödeme Yönetimi" subtitle={`#${odemeModal.id} · ${odemeModal.musteri_ad}`} icon="info" size="wide" onClose={() => setOdemeModal(null)}>
            <div className="modal-info">
              <div className="modal-info-row">
                <span className="info-label">Toplam:</span>
                <strong>{formatPara(odemeModal.toplam)}</strong>
              </div>
              <div className="modal-info-row">
                <span className="info-label">Ödenen:</span>
                <strong style={{ color: 'var(--color-success)' }}>{formatPara(odemeModal.odenen)}</strong>
              </div>
              <div className="modal-info-row">
                <span className="info-label">Kalan:</span>
                <strong className={odemeModal.kalan > 0 ? 'money-value kalan' : 'money-value tamam'}>
                  {odemeModal.tamamen_odendi ? 'Tamamen ödendi ✓' : formatPara(odemeModal.kalan)}
                </strong>
              </div>
            </div>

            {!odemeModal.tamamen_odendi && (
              <form onSubmit={saveOdeme} style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ margin: 0 }}>Yeni Ödeme</label>
                  <button 
                    type="button" 
                    onClick={() => setOdemeForm({ ...odemeForm, tutar: odemeModal.kalan })}
                    style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '13px', fontWeight: '600', padding: 0 }}
                  >
                    Tümünü Öde
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={odemeModal.kalan}
                    placeholder="Tutar"
                    value={odemeForm.tutar}
                    onChange={(e) => setOdemeForm({ ...odemeForm, tutar: e.target.value })}
                    required
                    style={{ flex: 1 }}
                  />
                  <select
                    value={odemeForm.odeme_turu}
                    onChange={(e) => setOdemeForm({ ...odemeForm, odeme_turu: e.target.value })}
                    style={{ flex: 1 }}
                  >
                    <option value="nakit">Nakit</option>
                    <option value="kart">Kart</option>
                    <option value="iban">IBAN</option>
                    <option value="havale">Havale</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Açıklama (opsiyonel)"
                  value={odemeForm.aciklama}
                  onChange={(e) => setOdemeForm({ ...odemeForm, aciklama: e.target.value })}
                  style={{ marginTop: 8 }}
                />
                <button type="submit" className="btn-primary" style={{ marginTop: 12, width: '100%' }}>
                  Ödeme Ekle
                </button>
              </form>
            )}

            {odemeler.length > 0 && (
              <>
                <label style={{ marginTop: 20 }}>Geçmiş Ödemeler</label>
                <div className="odeme-list">
                  {odemeler.map(p => (
                    <div key={p.id} className="odeme-item">
                      <div>
                        <strong>{formatPara(p.tutar)}</strong>
                        <span className="odeme-tur"> · {p.odeme_turu}</span>
                        {p.aciklama && <span className="odeme-aciklama"> · {p.aciklama}</span>}
                        <div className="odeme-tarih">{new Date(p.created_at).toLocaleString('tr-TR')}</div>
                      </div>
                      <button className="btn-sm btn-danger" onClick={() => silOdeme(p.id)}>
                        Sil
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-primary" onClick={() => setOdemeModal(null)}>
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
    </section>
  )
}