import React, { useEffect, useState, useRef } from 'react';
import { budgetService } from '../services/budget.service';

interface AttachmentFile {
  id?: number | string;
  nombre?: string;
  name?: string;
}

interface CertificateTemplateProps {
  solicitudId: number | string;
  selectedAttachmentIds?: number[];
  selectedAttachments?: AttachmentFile[];
  cuentaContable?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
  addToast?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const CertificateTemplate: React.FC<CertificateTemplateProps> = ({ solicitudId, selectedAttachments, cuentaContable, onCancel, onSuccess, addToast }) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setIsLoading(true);
        const html = await budgetService.getCertificateTemplate(solicitudId, cuentaContable);
        setHtmlContent(html);
      } catch (err: any) {
        console.error('Error al obtener el certificado:', err);
        setError(err.message || 'Error al cargar el certificado');
        if (addToast) {
          addToast('Error al cargar el certificado', 'error');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificate();
  }, [addToast]);

  const handleSave = async () => {
    const form = containerRef.current?.querySelector('form');
    if (form) {
      setIsSaving(true);
      try {
        const formData = new FormData(form);
        
        const selectedIds = selectedAttachments?.map(a => a.id) || [];
        if (selectedIds.length > 0) {
          formData.append('attachment_ids', JSON.stringify(selectedIds));
        }
        
        const response = await budgetService.createCertificateFromTemplate(solicitudId, formData);
        window.open(response.url_view, '_blank');
        if (onSuccess) {
          onSuccess();
        }
      } catch (err: any) {
        const errorMessage = err.error || 'Error al generar el certificado';
        setError(errorMessage);
        if (addToast) {
          addToast(errorMessage, 'error');
        }
      } finally {
        setIsSaving(false);
      }
    } else {
      if (addToast) {
        addToast('No se encontró el formulario del certificado', 'error');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="cep-vacio" role="status">
        <div className="spinner-border text-primary"><span className="visually-hidden">Cargando el certificado…</span></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="suite-card cep-vacio">
        <i className="bi bi-exclamation-circle" aria-hidden="true"></i>
        <p className="page-sub mt-2 mb-3">{error}</p>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-outline-suite">
            Volver
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="cep-lectura">
      <div className="cep-encabezado">
        {onCancel && (
          <button type="button" onClick={onCancel} className="icon-btn" aria-label="Volver a la solicitud" title="Volver">
            <i className="bi bi-arrow-left" aria-hidden="true"></i>
          </button>
        )}
        <div className="cep-encabezado-texto">
          <h1 className="page-title">Certificado de Disponibilidad Presupuestal</h1>
          <p className="page-sub mb-0">Vista previa del certificado</p>
        </div>
      </div>

      <div className="suite-card">
        {/* HTML del certificado (plantilla del servidor, la misma del PDF): se dibuja tal cual. */}
        <div
          id="certificate-template-preview"
          className="cep-certificado"
          ref={containerRef}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {selectedAttachments && selectedAttachments.length > 0 && (
          <div className="cep-seccion mt-0 px-4 pb-3">
            <h2 className="cep-seccion-titulo">Cotizaciones incluidas</h2>
            <ul className="list-unstyled mb-0 d-grid gap-1 small">
              {selectedAttachments.map((attachment, index) => (
                <li key={attachment.id || index} className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle text-success" aria-hidden="true"></i>
                  {attachment.nombre || attachment.name || 'Archivo'}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="cep-form-pie mt-0 px-4 pb-4">
          <button type="button" onClick={onCancel} disabled={isSaving} className="btn btn-outline-suite">
            Cancelar
          </button>
          <button type="button" onClick={handleSave} disabled={isSaving}
                  className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2">
            {isSaving ? (
              <>
                <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                Guardando...
              </>
            ) : (
              <>
                <i className="bi bi-file-earmark-check" aria-hidden="true"></i>
                Guardar certificado
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateTemplate;
