import { useState, useEffect } from 'react';
import api from '../services/api';
import ErrorModal from './ErrorModal';
import ConfirmModal from './ConfirmModal';
import Modal from './Modal';

function formatPara(tutar) {
  if (tutar == null) return '—';
  return `${Number(tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
}

export default function CarpetTypesTab() {
  const [carpetTypes, setCarpetTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { mode: 'new' | 'edit', data: {} }
  const [form, setForm] = useState({ name: '', price_per_m2: '' });

  const [errorModal, setErrorModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  useEffect(() => {
    loadCarpetTypes();
  }, []);

  const loadCarpetTypes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/carpet_types');
      setCarpetTypes(res.data);
    } catch (err) {
      setErrorModal({ baslik: 'Hata', mesaj: err.response?.data?.hata || 'Halı tipleri yüklenirken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setForm({ name: '', price_per_m2: '' });
    setModal({ mode: 'new' });
  };

  const openEdit = (ct) => {
    setForm({ name: ct.name, price_per_m2: ct.price_per_m2 });
    setModal({ mode: 'edit', data: ct });
  };

  const saveCarpetType = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setErrorModal({ baslik: 'Eksik Bilgi', mesaj: 'Halı tipi adı boş bırakılamaz.' });
      return;
    }
    if (form.price_per_m2 === '' || isNaN(parseFloat(form.price_per_m2)) || parseFloat(form.price_per_m2) <= 0) {
      setErrorModal({ baslik: 'Geçersiz Fiyat', mesaj: 'm² fiyatı pozitif bir sayı olmalıdır.' });
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        price_per_m2: parseFloat(form.price_per_m2),
      };

      if (modal.mode === 'new') {
        await api.post('/carpet_types', payload);
      } else {
        await api.put(`/carpet_types/${modal.data.id}`, payload);
      }
      setModal(null);
      loadCarpetTypes();
    } catch (err) {
      setErrorModal({ baslik: 'Hata', mesaj: err.response?.data?.hata || 'Halı tipi kaydedilirken bir hata oluştu.' });
    }
  };

  const deleteCarpetType = async (ct) => {
    setConfirmModal({
      baslik: 'Halı Tipi Sil',
      mesaj: `'${ct.name}' adlı halı tipini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      onConfirm: async () => {
        setConfirmModal(null) // Modalı hemen kapat
        try {
          await api.delete(`/carpet_types/${ct.id}`);
          loadCarpetTypes();
        } catch (err) {
          setErrorModal({ baslik: 'Hata', mesaj: err.response?.data?.hata || 'Halı tipi silinirken bir hata oluştu.' });
        }
      },
    });
  };

  return (
    <section className="card">
      <div className="card-header">
        <h2>Halı Tipleri ({carpetTypes.length})</h2>
        <button className="btn-primary" onClick={openNew}>+ Yeni Halı Tipi</button>
      </div>

      <div className="modal-info" style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '14px', color: 'var(--color-text)' }}>
          <strong>Bilgi:</strong> Buraya eklediğiniz halı tipleri ve m² fiyatları, sipariş oluştururken otomatik olarak önerilecektir.
        </p>
      </div>

      {loading ? (
        <p className="empty">Yükleniyor...</p>
      ) : carpetTypes.length === 0 ? (
        <p className="empty">Henüz tanımlanmış halı tipi yok. Sağ üstten ekleyebilirsiniz.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Halı Tipi Adı</th>
                <th>m² Fiyatı</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {carpetTypes.map((ct) => (
                <tr key={ct.id}>
                  <td><strong>{ct.name}</strong></td>
                  <td>{formatPara(ct.price_per_m2)}/m²</td>
                  <td className="actions">
                    <button className="btn-sm" onClick={() => openEdit(ct)}>Düzenle</button>
                    <button className="btn-sm btn-danger" onClick={() => deleteCarpetType(ct)}>Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal
          title={modal.mode === 'new' ? 'Yeni Halı Tipi Ekle' : 'Halı Tipi Düzenle'}
          subtitle="Sipariş oluştururken m² fiyatı otomatik önerilir."
          icon={modal.mode === 'new' ? 'info' : null}
          onClose={() => setModal(null)}
        >
          <form onSubmit={saveCarpetType}>
            <label>Halı Tipi Adı *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Örn: Yünlü, Akrilik, El Dokuma"
            />

            <label style={{ marginTop: 12 }}>m² Fiyatı *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={form.price_per_m2}
              onChange={(e) => setForm({ ...form, price_per_m2: e.target.value })}
              placeholder="Örn: 25.00"
            />

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>İptal</button>
              <button type="submit" className="btn-primary">{modal.mode === 'new' ? 'Ekle' : 'Kaydet'}</button>
            </div>
          </form>
        </Modal>
      )}

      {errorModal && <ErrorModal {...errorModal} onClose={() => setErrorModal(null)} />}
      {confirmModal && <ConfirmModal {...confirmModal} onClose={() => setConfirmModal(null)} />}
    </section>
  );
}