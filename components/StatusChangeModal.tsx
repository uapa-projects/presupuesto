import React, { useState, useEffect } from 'react';

export interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comments: string) => void;
  isLoading?: boolean;
  title: string;
  description: string;
  confirmText: string;
  buttonColor?: 'rose' | 'blue';
  placeholder?: string;
  label?: string;
}

/** Ventana con el marcado de los modales de Bootstrap; la abre y cierra React (no usa bootstrap.Modal). */
const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  title,
  description,
  confirmText,
  buttonColor = 'rose',
  placeholder,
  label
}) => {
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setComments('');
    const alPulsar = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isLoading) onClose(); };
    document.addEventListener('keydown', alPulsar);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', alPulsar);
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, isLoading, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(comments);
  };

  if (!isOpen) return null;

  const peligro = buttonColor === 'rose';
  const idTitulo = 'cambio-estado-titulo';

  return (
    <>
      <div className="modal d-block cep-modal" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={idTitulo}
           onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onClose(); }}>
        <div className="modal-dialog modal-dialog-centered">
          <form className="modal-content" onSubmit={handleSubmit}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title h5" id={idTitulo}>
                  <i className={`bi ${peligro ? 'bi-exclamation-triangle text-danger' : 'bi-arrow-repeat'} me-2`} aria-hidden="true"></i>
                  {title}
                </h2>
                <p className="page-sub small mb-0">{description}</p>
              </div>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose} disabled={isLoading}></button>
            </div>
            <div className="modal-body">
              <label htmlFor="status-change-reason" className="form-label">{label || 'Comentario'}</label>
              <textarea
                id="status-change-reason"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={placeholder || 'Escriba un comentario...'}
                className="form-control"
                rows={5}
                required
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button type="button" onClick={onClose} disabled={isLoading} className="btn btn-outline-suite">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!comments.trim() || isLoading}
                className={`btn ${peligro ? 'btn-danger' : 'btn-primary'} d-inline-flex align-items-center gap-2`}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                    Procesando...
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default StatusChangeModal;
