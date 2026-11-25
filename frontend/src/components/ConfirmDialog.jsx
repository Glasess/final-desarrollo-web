import { useEffect } from 'react';

export default function ConfirmDialog({ title, message, confirmText = 'Eliminar', onConfirm, onCancel, busy }) {
  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="overlay" onClick={onCancel}>
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dlg-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="dlg-title">{title}</h3>
        <p>{message}</p>
        <div className="actions end">
          <button className="btn secondary" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button className="btn danger" onClick={onConfirm} disabled={busy} autoFocus>
            {busy ? 'Eliminando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
