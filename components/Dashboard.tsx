import React, { useState, useMemo, useEffect } from 'react';
import { User, Role, BudgetRequest, BudgetStatus } from '../types';
import BudgetCard from './BudgetCard';

interface DashboardProps {
  user: User;
  requests: BudgetRequest[];
  filters: {
    selectedYear: number;
    selectedMonth: number;
    statusFilter: BudgetStatus | 'TODOS';
  };
  onViewDetails: (id: string) => void;
  onEdit: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: number | string) => void;
  onFiltersChange: (filters: { selectedYear?: number; selectedMonth?: number; statusFilter?: BudgetStatus | 'TODOS' }) => void;
  lastUpdated?: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ user, requests, filters, onViewDetails, onEdit, onCreate, onDelete, onFiltersChange, lastUpdated }) => {
  const isCollaborator = user.role === Role.COLABORADOR;
  const isSupervisor = user.role === Role.SUPERVISOR;
  const isCompraRSS = user.role === Role.COMPRA_RSS;
  const isCompraRSD = user.role === Role.COMPRA_RSD;
  const isCompraRCO = user.role === Role.COMPRA_RCO;
  const isCompra = isCompraRSS || isCompraRSD || isCompraRCO;

  const { selectedYear, selectedMonth, statusFilter } = filters;
  const setSelectedYear = (year: number) => onFiltersChange({ selectedYear: year });
  const setStatusFilter = (status: BudgetStatus | 'TODOS') => onFiltersChange({ statusFilter: status });
  const setSelectedMonth = (month: number) => onFiltersChange({ selectedMonth: month });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<'fecha_solicitud' | 'fecha_actividad'>('fecha_solicitud');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1];
  }, []);

  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  const filteredRequests = useMemo(() => {
    let list = requests || [];

    // if (isCollaborator) {
    //   list = list.filter(r => 
    //     r.colaborador && 
    //     String(r.colaborador.id) === String(user.id)
    //   );
    // }

    // Filtro por año y mes basado en ISO 8601 "YYYY-MM-DDTHH:MM:SS..."
    list = list.filter(r => {
      if (!r.fecha_solicitud) return true;
      try {
        const [year, month] = r.fecha_solicitud.split('T')[0].split('-');
        return (
          parseInt(year) === selectedYear &&
          parseInt(month) === selectedMonth
        );
      } catch (e) {
        console.error("Error parsing fecha_solicitud:", e);
        return true;
      }
    });

    // Filtro por estado
    if (statusFilter !== 'TODOS') {
      list = list.filter(r => r.estado === statusFilter);
    }

    // Filtro por búsqueda de texto (mínimo 3 caracteres)
    if (searchQuery.trim().length >= 3) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(r => {
        const titulo = (r.titulo || '').toLowerCase();
        const descripcion = (r.descripcion || '').toLowerCase();
        const solicitante = r.colaborador
          ? `${r.colaborador.first_name} ${r.colaborador.last_name} ${r.colaborador.username}`.toLowerCase()
          : '';
        const ubicacion = (r.ubicacion?.nombre || '').toLowerCase();
        return titulo.includes(q) || descripcion.includes(q) || solicitante.includes(q) || ubicacion.includes(q);
      });
    }

    return list;
  }, [requests, user, selectedYear, selectedMonth, statusFilter, searchQuery, sortField, sortDirection]);

  const sortedRequests = useMemo(() => {
    const sortFn = (a: BudgetRequest, b: BudgetRequest) => {
      const dateA = a[sortField] ? new Date(a[sortField]).getTime() : 0;
      const dateB = b[sortField] ? new Date(b[sortField]).getTime() : 0;
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    };

    return [...filteredRequests].sort(sortFn);
  }, [filteredRequests, sortField, sortDirection]);

  const ordenar = (campo: 'fecha_solicitud' | 'fecha_actividad') => {
    setSortField(campo);
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };
  const flecha = sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  const nombreMes = months.find(m => m.value === selectedMonth)?.label;

  return (
    <>
      <div className="cep-encabezado">
        <div className="cep-encabezado-texto">
          <h1 className="page-title">
            {isSupervisor || isCompra ? 'Todas las solicitudes' : 'Mis solicitudes'}
          </h1>
          <p className="page-sub mb-0">Periodo {nombreMes} {selectedYear}</p>
          {lastUpdated && (
            <p className="cep-actualizado mb-0 mt-1">
              Actualizado: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
        {(isCollaborator || isCompra) && (
          <button type="button" onClick={onCreate} className="btn btn-primary d-inline-flex align-items-center gap-2">
            <i className="bi bi-plus-lg" aria-hidden="true"></i>
            Nueva solicitud
          </button>
        )}
      </div>

      <div className="cep-filtro" role="search">
        <div>
          <span className="form-label d-block" id="filtro-anio">Año</span>
          <div className="btn-group" role="group" aria-labelledby="filtro-anio">
            {years.map(year => (
              <button
                key={year}
                type="button"
                onClick={() => setSelectedYear(year)}
                aria-pressed={selectedYear === year}
                className={`btn btn-outline-suite${selectedYear === year ? ' active' : ''}`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="form-label" htmlFor="filtro-mes">Mes</label>
          <select
            id="filtro-mes"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="form-select"
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label" htmlFor="filtro-estado">Estado</label>
          <select
            id="filtro-estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="form-select"
          >
            <option value="TODOS">Todas</option>
            <option value={BudgetStatus.PENDING}>Pendientes</option>
            <option value={BudgetStatus.APPROVED}>Aprobadas</option>
            <option value={BudgetStatus.REJECTED}>Rechazadas</option>
          </select>
        </div>

        <div>
          <span className="form-label d-block" id="filtro-orden">Ordenar por</span>
          <div className="btn-group" role="group" aria-labelledby="filtro-orden">
            <button
              type="button"
              onClick={() => ordenar('fecha_solicitud')}
              className={`btn btn-outline-suite btn-sm${sortField === 'fecha_solicitud' ? ' active' : ''}`}
            >
              Solicitud
              {sortField === 'fecha_solicitud' && <i className={`bi ${flecha}`} aria-hidden="true"></i>}
            </button>
            <button
              type="button"
              onClick={() => ordenar('fecha_actividad')}
              className={`btn btn-outline-suite btn-sm${sortField === 'fecha_actividad' ? ' active' : ''}`}
            >
              Actividad
              {sortField === 'fecha_actividad' && <i className={`bi ${flecha}`} aria-hidden="true"></i>}
            </button>
          </div>
        </div>

        <div className="cep-buscar">
          <label className="form-label" htmlFor="filtro-buscar">Buscar</label>
          <div className="input-group">
            <span className="input-group-text"><i className="bi bi-search" aria-hidden="true"></i></span>
            <input
              id="filtro-buscar"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Título, solicitante, descripción o ubicación"
              className="form-control"
              aria-describedby="filtro-buscar-ayuda"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="btn btn-outline-suite" aria-label="Borrar búsqueda">
                <i className="bi bi-x-lg" aria-hidden="true"></i>
              </button>
            )}
          </div>
        </div>
      </div>
      {searchQuery.length > 0 && searchQuery.length < 3 && (
        <p className="cep-actualizado" id="filtro-buscar-ayuda">Escribe al menos 3 caracteres para buscar.</p>
      )}

      {sortedRequests.length === 0 ? (
        <div className="suite-card cep-vacio">
          <i className="bi bi-file-earmark-text" aria-hidden="true"></i>
          <p className="page-sub mt-2 mb-0">No se encontraron solicitudes para este periodo.</p>
        </div>
      ) : (
        <div className="row g-3 g-lg-4">
          {sortedRequests.map(req => (
            <div key={req.id} className="col-12 col-md-6 col-xl-4">
              <BudgetCard
                request={req}
                onView={() => onViewDetails(String(req.id))}
                onEdit={() => onEdit(String(req.id))}
                onDelete={() => onDelete(String(req.id))}
                userRole={user.role}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default Dashboard;
