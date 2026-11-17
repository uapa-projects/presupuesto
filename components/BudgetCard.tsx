import React from 'react';
import { BudgetRequest, BudgetStatus, Role } from '../types';
import { useCatalogs } from '../context/CatalogContext';
import { UnisexAvatar } from './BudgetDetails';
import EstadoSolicitud from './EstadoSolicitud';
import { dnsDateFormat, formatCurrency, formatServerDate } from '../utils/dateUtils';

interface BudgetCardProps {
  request: BudgetRequest;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  userRole: Role;
}

const BudgetCard: React.FC<BudgetCardProps> = ({ request, onView, onEdit, onDelete, userRole }) => {
  const isCollaborator = userRole === Role.COLABORADOR;
  const isSupervisor = userRole === Role.SUPERVISOR;
  let canEdit = isCollaborator && (request.estado === BudgetStatus.PENDING || request.estado === BudgetStatus.POR_REVISION);
  canEdit = canEdit || (isSupervisor && !request.tiene_certificado);
  const canDelete = isCollaborator && request.estado === BudgetStatus.PENDING;
  const { ESTADO_CHOICES, getLabel } = useCatalogs();

  const fullName = request.colaborador
    ? `${request.colaborador.first_name} ${request.colaborador.last_name}`
    : 'Colaborador';

  return (
    <article className="suite-card cep-solicitud">
      <div className="d-flex justify-content-between align-items-center gap-2">
        <EstadoSolicitud estado={request.estado} texto={getLabel(ESTADO_CHOICES, request.estado)} />
        <span className="cep-actualizado">{dnsDateFormat(request.fecha_solicitud)}</span>
      </div>

      <h2 className="cep-solicitud-titulo">{request.titulo}</h2>
      <p className="cep-solicitud-desc">{request.descripcion}</p>

      <dl className="cep-cifras">
        <div>
          <dt>Presupuesto</dt>
          <dd>{formatCurrency(request.presupuesto_pre_aprobado)}</dd>
        </div>
        <div>
          <dt>A ejecutar</dt>
          <dd className="cep-ejecutar">{formatCurrency(request.monto_a_ejecutar)}</dd>
        </div>
        <div>
          <dt>Fecha actividad</dt>
          <dd>{formatServerDate(request.fecha_actividad)}</dd>
        </div>
      </dl>

      {!isCollaborator && (
        <div className="cep-persona">
          <UnisexAvatar />
          <div className="min-w-0">
            <div className="cep-persona-nombre">{fullName}</div>
            <div className="cep-persona-sub">{request.ubicacion?.nombre || 'Sede'}</div>
          </div>
        </div>
      )}

      <div className="cep-solicitud-pie">
        <button type="button" onClick={onView} className="btn btn-outline-suite flex-grow-1">
          Ver detalles
        </button>
        {canEdit && (
          <button type="button" onClick={onEdit} className="icon-btn" aria-label="Editar solicitud" title="Editar solicitud">
            <i className="bi bi-pencil" aria-hidden="true"></i>
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={() => { if (window.confirm('¿Estás seguro de eliminar esta solicitud?')) onDelete(); }}
            className="icon-btn cep-peligro"
            aria-label="Eliminar solicitud"
            title="Eliminar solicitud"
          >
            <i className="bi bi-trash" aria-hidden="true"></i>
          </button>
        )}
      </div>

      {request.confirmado && (
        <span className="cep-confirmado" title="Confirmado por Compra" role="img" aria-label="Confirmado por Compra">
          <i className="bi bi-check-lg" aria-hidden="true"></i>
        </span>
      )}
    </article>
  );
};
export default BudgetCard;
