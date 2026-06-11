import Modal from './Modal'

/* "Başarılı" başlıklı çağrılarda yeşil success ikonu, aksi halde kırmızı danger. */
export default function ErrorModal({ baslik, mesaj, onClose }) {
  const basarili = (baslik || '').toLocaleLowerCase('tr-TR').startsWith('başar')
  return (
    <Modal title={baslik || 'Hata'} icon={basarili ? 'success' : 'danger'} onClose={onClose}>
      <p className="modal-msg">{mesaj || 'Beklenmedik bir hata oluştu.'}</p>
      <div className="modal-actions">
        <button className="btn-primary" onClick={onClose}>Tamam</button>
      </div>
    </Modal>
  )
}
