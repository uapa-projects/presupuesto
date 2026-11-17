import React from 'react';
import { BudgetStatus } from '../types';

/** Estado de una solicitud como píldora .app-rol de la suite, con el color del estado (cep.css). */
const ESTILOS: Record<string, { clase: string; icono: string }> = {
  [BudgetStatus.PENDING]: { clase: 'cep-estado-pendiente', icono: 'bi-clock' },
  [BudgetStatus.POR_REVISION]: { clase: 'cep-estado-revision', icono: 'bi-arrow-repeat' },
  [BudgetStatus.APPROVED]: { clase: 'cep-estado-aprobada', icono: 'bi-shield-check' },
  [BudgetStatus.REJECTED]: { clase: 'cep-estado-rechazada', icono: 'bi-x-circle' },
};

const EstadoSolicitud: React.FC<{ estado: BudgetStatus; texto: string; grande?: boolean }> = ({ estado, texto, grande }) => {
  const { clase, icono } = ESTILOS[estado] || ESTILOS[BudgetStatus.PENDING];
  return (
    <span className={`app-rol cep-estado ${clase}${grande ? ' cep-estado-lg' : ''}`}>
      <i className={`bi ${icono}`} aria-hidden="true"></i>
      {texto}
    </span>
  );
};

export default EstadoSolicitud;
