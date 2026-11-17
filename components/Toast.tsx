import React, { useEffect, useState } from 'react';
import { ToastType } from '../types';

interface ToastContainerProps {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

const ICONOS: Record<ToastType['type'], string> = {
  success: 'bi-check-circle-fill',
  error: 'bi-x-circle-fill',
  warning: 'bi-exclamation-triangle-fill',
  info: 'bi-info-circle-fill',
};

const Toast: React.FC<{ toast: ToastType; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.max(0, 100 - (elapsed / toast.duration) * 100));
      if (elapsed >= toast.duration) {
        clearInterval(interval);
        onRemove(toast.id);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [toast, onRemove]);

  return (
    <div className={`cep-toast cep-toast-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
      <div className="cep-toast-cuerpo">
        <i className={`bi ${ICONOS[toast.type] || ICONOS.info}`} aria-hidden="true"></i>
        <span>{toast.message}</span>
        <button type="button" className="btn-close btn-sm" aria-label="Cerrar aviso" onClick={() => onRemove(toast.id)}></button>
      </div>
      <div className="cep-toast-barra" style={{ width: `${progress}%` }} />
    </div>
  );
};

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="cep-toasts" aria-live="polite">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

export default ToastContainer;
