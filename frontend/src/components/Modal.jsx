import { useEffect, useRef } from 'react'

/* Tek tutarlı stroke SVG ikon ailesi — emoji yok */
const MIcon = {
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>,
  danger: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  warning: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  info: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
  lock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  success: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
}

/*
  Paylaşılan modal kabuğu — overlay + animasyonlu kutu + ikon başlık + X kapat + ESC.
  Kullanım:
    <Modal title="Başlık" subtitle="alt" icon="danger" size="wide" onClose={fn}>
      ...form / içerik + .modal-actions...
    </Modal>
*/
export default function Modal({ title, subtitle, icon, onClose, size = 'md', closeOnOverlay = true, children }) {
  const boxRef = useRef(null)

  // ESC ile kapatma — onClose her render'da değişebileceği için ayrı effect
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Odaklama YALNIZCA açılışta bir kez çalışmalı; aksi halde her tuş vuruşunda
  // yeniden render olunca imleç ilk form alanına geri zıplar.
  useEffect(() => {
    const ilk = boxRef.current?.querySelector('.modal-body input, .modal-body textarea, .modal-body select')
    if (ilk) ilk.focus()
  }, [])

  return (
    <div className="modal-overlay" onClick={closeOnOverlay ? onClose : undefined}>
      <div
        ref={boxRef}
        className={`modal modal-shell ${size === 'wide' ? 'modal-wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-head">
          {icon && <span className={`modal-icon ${icon}`}>{MIcon[icon]}</span>}
          <div className="modal-head-text">
            {title && <h3 className="modal-title">{title}</h3>}
            {subtitle && <p className="modal-sub">{subtitle}</p>}
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Kapat">
            {MIcon.x}
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}
