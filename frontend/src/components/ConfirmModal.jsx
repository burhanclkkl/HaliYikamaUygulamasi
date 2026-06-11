import Modal from './Modal'

export default function ConfirmModal({ baslik, mesaj, onConfirm, onClose }) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal title={baslik || 'Onay Gerekiyor'} icon="warning" onClose={onClose}>
      <p className="modal-msg">{mesaj || 'Bu işlemi yapmak istediğinize emin misiniz?'}</p>
      <div className="modal-actions">
        <button className="btn-secondary" onClick={onClose}>İptal</button>
        <button className="btn-danger" onClick={handleConfirm}>Onayla</button>
      </div>
    </Modal>
  )
}
