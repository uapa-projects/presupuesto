import React, { useState } from 'react';
import Select from "react-select";
import { BudgetRequest, BudgetStatus, User, Role, ReviewNote } from '../types';
import { budgetService } from '../services/budget.service';
import { useCatalogs } from '../context/CatalogContext';
import AttachmentList from './AttachmentList';
import CertificateTemplate from './CertificateTemplate';
import StatusChangeModal from './StatusChangeModal';
import EstadoSolicitud from './EstadoSolicitud';
import { dnsDateFormat, formatCurrency, formatServerDate } from '../utils/dateUtils';
import { selectStyles } from '../utils/selectStyles';

interface BudgetDetailsProps {
  user: User;
  request: BudgetRequest;
  loading?: boolean;
  setLoading?: (loading: boolean) => void;
  onBack: () => void;
  onRequestUpdated: (updatedRequest: BudgetRequest) => void;
  onDeleteAttachment?: (id: number | string) => void;
  onCertificateCreated?: () => void;
  addToast?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const UnisexAvatar: React.FC<{ grande?: boolean }> = ({ grande }) => (
  <span className={`cep-avatar${grande ? ' cep-avatar-lg' : ''}`} aria-hidden="true">
    <i className="bi bi-person"></i>
  </span>
);

const BudgetDetails: React.FC<BudgetDetailsProps> = ({ user, request, loading = false, setLoading, onBack, onRequestUpdated, onDeleteAttachment, onCertificateCreated, addToast }) => {
  const { cuentasContables } = useCatalogs();
  const isSupervisor = user.role === Role.SUPERVISOR;

  const { ESTADO_CHOICES, TIPO_CHOICES, RUBRO_CHOICES, getLabel } = useCatalogs();
  const [showCertificateForm, setShowCertificateForm] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [isRequestingRevision, setIsRequestingRevision] = useState(false);
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<number[]>([]);
  const [cuentaContable, setCuentaContable] = useState('');

  const handleUpdateStatus = async (id: string, status: BudgetStatus, comments?: string) => {
    setLoading?.(true);
    try {
      const response = await budgetService.updateStatus(id, status, comments);

      let updatedRequest: BudgetRequest;

      if (status === BudgetStatus.REJECTED) {
        updatedRequest = { ...request, estado: status, observaciones_supervisor: comments || "" };
      } else if (status === BudgetStatus.POR_REVISION && comments) {
        const newReviewNote: ReviewNote = {
          id: response.newRevisionId,
          contenido: comments,
          supervisor: user.name || 'Supervisor',
          estado: 'PENDIENTE',
          fecha_creacion: new Date().toISOString()
        };
        updatedRequest = {
          ...request,
          estado: status,
          review_notes: [newReviewNote, ...(request.review_notes || [])]
        };
      } else {
        updatedRequest = { ...request, estado: status };
      }

      onRequestUpdated(updatedRequest);
      addToast?.(`Solicitud ${status.toLowerCase()} con éxito`, 'success');
    } catch (error: any) {
      addToast?.('Error al cambiar el estado de la solicitud.', 'error');
    } finally {
      setLoading?.(false);
    }
  };

  const certificadoFile = request.files?.find(f => f.es_certificado);
  const certificadoUrl = certificadoFile?.url_view;
  const regularFiles = (request.files?.filter(f => !f.es_certificado) || []).sort((a, b) => {
    const aApproved = certificadoUrl ? a.aprobado === true : selectedAttachmentIds.includes(a.id as number);
    const bApproved = certificadoUrl ? b.aprobado === true : selectedAttachmentIds.includes(b.id as number);
    return (aApproved === bApproved) ? 0 : aApproved ? -1 : 1;
  });

  const toggleAttachment = (fileId: number) => {
    setSelectedAttachmentIds(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleCreateCertificate = () => {
    if (!cuentaContable.trim()) {
      if (addToast) {
        addToast('Debe introducir la cuenta contable', 'error');
      }
      return;
    }
    setShowCertificateForm(true);
  };

  const handleSuccess = async () => {
    setShowCertificateForm(false);
    if (onCertificateCreated) {
      await onCertificateCreated();
    }
  };

  const handleApprovedStatus = () => {
    handleUpdateStatus(String(request.id), BudgetStatus.APPROVED, undefined);
  };

  const handleRejectConfirm = async (comments: string) => {
    setIsRejecting(true);
    try {
      handleUpdateStatus(String(request.id), BudgetStatus.REJECTED, comments);
      setShowRejectionModal(false);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleRevisionConfirm = async (comments: string) => {
    setIsRequestingRevision(true);
    try {
      handleUpdateStatus(String(request.id), BudgetStatus.POR_REVISION, comments);
      setShowRevisionModal(false);
    } finally {
      setIsRequestingRevision(false);
    }
  };

  const handleRevisionUpdate = async (noteId: number, newStatus: string) => {
    try {
      const result = await budgetService.updateRevisionStatus(noteId, newStatus);

      // Actualizar review_notes en el state con result.revision
      if (result.revision) {
        const updatedNotes = request.review_notes?.map(note =>
          note.id === noteId ? { ...note, estado: result.revision.estado } : note
        ) || [];

        const updatedRequest = {
          ...request,
          estado: result.solicitud.estado,
          review_notes: updatedNotes
        };

        onRequestUpdated(updatedRequest);

        addToast?.(`Estado actualizado a ${newStatus}`, 'success');
      }
      else{
        addToast?.('Error al actualizar el estado de la revisión.', 'error');
      }
    } catch (error: any) {
      addToast?.('Error al actualizar el estado de la revisión.', 'error');
    }
  };

  const DetailItem = ({ label, value }: { label: string, value: string | number }) => (
    <div className="cep-dato">
      <dt>{label}</dt>
      <dd>{value || 'N/A'}</dd>
    </div>
  );

  const fullName = request.colaborador
    ? `${request.colaborador.first_name} ${request.colaborador.last_name}`
    : 'Colaborador';
  const hasPendingReview = request.review_notes?.some(note => note.estado === 'PENDIENTE') ?? false;

  if (showCertificateForm) {
    const selectedFiles = regularFiles.filter(f => selectedAttachmentIds.includes(f.id as number));
    return (
      <CertificateTemplate
        solicitudId={request.id}
        selectedAttachments={selectedFiles}
        cuentaContable={cuentaContable}
        onCancel={() => {
          setShowCertificateForm(false);
          setSelectedAttachmentIds([]);
          setCuentaContable('');
        }}
        onSuccess={handleSuccess}
        addToast={addToast}
      />
    );
  }
  return (
    <>
      <div className="cep-encabezado">
        <button type="button" onClick={onBack} className="icon-btn" aria-label="Volver a Solicitudes" title="Volver">
          <i className="bi bi-arrow-left" aria-hidden="true"></i>
        </button>
        <div className="cep-encabezado-texto">
          <h1 className="page-title">{request.titulo}</h1>
          <p className="page-sub mb-0">Solicitada el {dnsDateFormat(request.fecha_solicitud)}</p>
        </div>
        <EstadoSolicitud estado={request.estado} texto={getLabel(ESTADO_CHOICES, request.estado)} grande />
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="suite-card panel">
            <dl className="cep-datos">
              <DetailItem label="Ubicación" value={request.ubicacion?.nombre} />
              <DetailItem label="Tipo de solicitud" value={getLabel(TIPO_CHOICES, request.tipo_solicitud)} />
              <DetailItem label="Rubro presupuestal" value={getLabel(RUBRO_CHOICES, request.rubro_presupuestal)} />
              <DetailItem label="Cuenta analítica" value={`${request.cuenta_analitica?.codigo} - ${request.cuenta_analitica?.nombre}`} />
              <DetailItem label="Presupuesto pre-aprobado" value={formatCurrency(request.presupuesto_pre_aprobado)} />
              <DetailItem label="Monto a ejecutar" value={formatCurrency(request.monto_a_ejecutar)} />
              <DetailItem label="Fecha de la actividad" value={formatServerDate(request.fecha_actividad)} />
              <DetailItem label="Fecha de solicitud" value={formatServerDate(request.fecha_solicitud)} />
            </dl>

            <section className="cep-seccion">
              <h2 className="cep-seccion-titulo">Descripción de la actividad</h2>
              <p className="cep-texto">{request.descripcion}</p>
            </section>

            {request.estado !== BudgetStatus.APPROVED && (
              <section className="cep-seccion">
                <h2 className="cep-seccion-titulo">Documentación adjunta</h2>
                <AttachmentList files={request.files} />
              </section>
            )}

            {request.review_notes && request.review_notes.length > 0 && (
              <section className="cep-seccion pb-3">
                <h2 className="cep-seccion-titulo">Notas de revisión ({request.review_notes.length})</h2>
                {request.review_notes.map((note) => (
                  <div key={note.id} className="cep-nota">
                    <div className="cep-nota-cabeza">
                      <strong>{note.supervisor}</strong>
                      {note.estado ? (
                        <span className={`app-rol ${note.estado === 'RESUELTA' ? 'cep-estado-aprobada' : 'cep-estado-pendiente'}`}>
                          {note.estado}
                        </span>
                      ) : null}
                      {note.estado === 'PENDIENTE' && (
                        <button
                          type="button"
                          onClick={() => handleRevisionUpdate(note.id, 'RESUELTA')}
                          className="btn btn-outline-suite btn-sm"
                          disabled={loading}
                        >
                          <i className="bi bi-check2 me-1" aria-hidden="true"></i>Marcar como resuelta
                        </button>
                      )}
                      <span className="cep-actualizado">{dnsDateFormat(note.fecha_creacion)}</span>
                    </div>
                    <p className="cep-texto small">{note.contenido}</p>
                  </div>
                ))}
              </section>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="col-12 col-lg-4 d-flex flex-column gap-4">
          <div className="suite-card panel pb-4">
            <div className="panel-head"><h2>Solicitante</h2></div>
            <div className="cep-persona">
              <UnisexAvatar grande />
              <div className="min-w-0">
                <div className="cep-persona-nombre">{fullName}</div>
                <div className="cep-persona-sub">{request.colaborador?.username || ''}</div>
              </div>
            </div>
          </div>

          {request.estado === BudgetStatus.REJECTED && (
            <div className="cep-aviso cep-aviso-rechazada" role="note">
              <strong className="d-block mb-1">Observaciones</strong>
              {request.observaciones_supervisor || 'No se proporcionaron comentarios adicionales.'}
            </div>
          )}

          {user.role === Role.SUPERVISOR && (request.estado === BudgetStatus.PENDING || request.estado === BudgetStatus.POR_REVISION) && (
            <div className="suite-card panel pb-4">
              <div className="panel-head"><h2>Acción</h2></div>
              <div className="cep-acciones">
                <button
                  type="button"
                  onClick={() => handleApprovedStatus()}
                  disabled={hasPendingReview}
                  title={hasPendingReview ? 'Hay revisiones pendientes' : undefined}
                  className="btn btn-primary"
                >
                  <i className="bi bi-check-lg" aria-hidden="true"></i>
                  Aprobar
                </button>
                <button type="button" onClick={() => setShowRevisionModal(true)} className="btn btn-outline-suite">
                  <i className="bi bi-arrow-repeat" aria-hidden="true"></i>
                  Solicitar revisión
                </button>
                <button type="button" onClick={() => setShowRejectionModal(true)} className="btn btn-outline-danger">
                  <i className="bi bi-x-lg" aria-hidden="true"></i>
                  Rechazar solicitud
                </button>
                {hasPendingReview && (
                  <p className="cep-actualizado mb-0">Hay revisiones pendientes: márcalas como resueltas para aprobar.</p>
                )}
              </div>
            </div>
          )}

          {request.estado === BudgetStatus.APPROVED && (
            <div className="suite-card panel pb-4 d-flex flex-column gap-3">
              {request.confirmado && (
                <div className="cep-aviso cep-aviso-aprobada" role="note">
                  <i className="bi bi-check-circle me-2" aria-hidden="true"></i>Confirmada por Compra.
                </div>
              )}
              {certificadoUrl && (
                <div>
                  <div className="panel-head"><h2>Certificado generado</h2></div>
                  <div className="cep-archivo is-on">
                    <i className="bi bi-file-earmark-pdf" aria-hidden="true"></i>
                    <span className="cep-archivo-nombre">Certificado de aprobación (PDF)</span>
                    <a href={certificadoUrl} target="_blank" rel="noopener noreferrer" className="icon-btn"
                       aria-label="Abrir el certificado" title="Abrir el certificado">
                      <i className="bi bi-box-arrow-up-right" aria-hidden="true"></i>
                    </a>
                  </div>
                </div>
              )}
              {isSupervisor && (
                <div className="panel-head mb-0"><h2>{certificadoUrl ? 'Cotizaciones' : 'Certificado'}</h2></div>
              )}
              {!certificadoUrl && isSupervisor && (
                <div>
                  <label className="form-label" htmlFor="cuenta-contable">Cuenta contable</label>
                  <Select
                    inputId="cuenta-contable"
                    styles={selectStyles()}
                    onChange={(newValue) => {
                      setCuentaContable(String(newValue.value));
                    }}
                    options={cuentasContables.map(c=>({value: c.id, label: `${c.codigo} - ${c.nombre}`}))} placeholder="Seleccione la cuenta..." />
                </div>
              )}
              {!certificadoUrl && isSupervisor && regularFiles.length > 0 && (
                <p className="form-label mb-0">Seleccione las cotizaciones</p>
              )}
              {regularFiles.length > 0 && (
                <div className="d-grid gap-2">
                  {regularFiles.map((file) => {
                    const fileId = file.id as number;
                    const isApproved = file.aprobado === true;
                    const isSelected = certificadoUrl ? isApproved : selectedAttachmentIds.includes(fileId);
                    const nombre = file.nombre || file.name || '';
                    const estado = certificadoUrl ? (isApproved ? ' is-on' : ' is-off') : '';

                    return (
                      <div key={fileId} className={`cep-archivo${estado}`}>
                        <input
                          type="checkbox"
                          className="form-check-input m-0 flex-shrink-0"
                          id={`cotizacion-${fileId}`}
                          checked={isSelected}
                          onChange={certificadoUrl ? undefined : () => toggleAttachment(fileId)}
                          disabled={!!certificadoUrl}
                        />
                        <label className="cep-archivo-nombre" htmlFor={`cotizacion-${fileId}`} title={nombre}>
                          {nombre}
                        </label>
                        {file.url_view && (
                          <a href={file.url_view} target="_blank" rel="noopener noreferrer" className="icon-btn"
                             aria-label={`Ver ${nombre}`} title="Ver archivo">
                            <i className="bi bi-box-arrow-up-right" aria-hidden="true"></i>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {!certificadoUrl && isSupervisor && (
                <div className="cep-acciones">
                  <button type="button" onClick={handleCreateCertificate} className="btn btn-primary">
                    <i className="bi bi-file-earmark-check" aria-hidden="true"></i>
                    Crear certificado
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <StatusChangeModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        onConfirm={handleRejectConfirm}
        isLoading={isRejecting}
        title="Rechazar solicitud"
        description="Por favor indique el motivo del rechazo"
        confirmText="Confirmar rechazo"
        buttonColor="rose"
        label="Motivo del rechazo"
        placeholder="Explique el motivo por el cual está rechazando esta solicitud..."
      />

      <StatusChangeModal
        isOpen={showRevisionModal}
        onClose={() => setShowRevisionModal(false)}
        onConfirm={handleRevisionConfirm}
        isLoading={isRequestingRevision}
        title="Solicitar revisión"
        description="Indique los cambios o información requerida"
        confirmText="Confirmar"
        buttonColor="blue"
        label="Comentarios"
        placeholder="Indique qué cambios o información adicional se requiere..."
      />
    </>
  );
};
export {UnisexAvatar};
export default BudgetDetails;
