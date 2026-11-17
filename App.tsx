import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Role, User, BudgetRequest, BudgetStatus, ToastType } from './types';
import Dashboard from './components/Dashboard';
import BudgetDetails from './components/BudgetDetails';
import BudgetForm from './components/BudgetForm';
import ToastContainer from './components/Toast';
import CertificatePreview from './components/CertificatePreview';
import Administracion from './components/admin/Administracion';
import { budgetService } from './services/budget.service';
import { irAlLogin } from './services/session';
import { CatalogProvider, useCatalogs } from './context/CatalogContext';

const SinResultado: React.FC<{ icono: string; texto: string; children?: React.ReactNode }> = ({ icono, texto, children }) => (
  <div className="suite-card cep-vacio">
    <i className={`bi ${icono}`} aria-hidden="true"></i>
    <p className="page-sub mt-2 mb-3">{texto}</p>
    {children}
  </div>
);

interface DashboardViewProps {
  user: User;
  requests: BudgetRequest[];
  filters: {
    selectedYear: number;
    selectedMonth: number;
    statusFilter: BudgetStatus | 'TODOS';
  };
  onViewDetails: (id: number | string) => void;
  onEdit: (id: number | string) => void;
  onDelete: (id: number | string) => void;
  onFiltersChange: (newFilters: { selectedYear?: number; selectedMonth?: number; statusFilter?: BudgetStatus | 'TODOS' }) => void;
  lastUpdated: string | null;
}

const DashboardView: React.FC<DashboardViewProps> = ({ user, requests, filters, onViewDetails, onEdit, onDelete, onFiltersChange, lastUpdated }) => {
  const navigate = useNavigate();
  return (
    <Dashboard 
      user={user} 
      requests={requests} 
      filters={filters}
      onViewDetails={onViewDetails}
      onEdit={onEdit}
      onCreate={() => navigate('/create')}
      onDelete={onDelete}
      onFiltersChange={onFiltersChange}
      lastUpdated={lastUpdated}
    />
  );
};

interface BudgetDetailsViewProps {
  user: User;
  requests: BudgetRequest[];
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onRequestUpdated: (updatedRequest: BudgetRequest) => void;
  onDeleteAttachment?: (id: number | string, requestId?: string) => void;
  onCertificateCreated: () => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const BudgetDetailsView: React.FC<BudgetDetailsViewProps> = ({ user, requests, loading, setLoading, onRequestUpdated, onDeleteAttachment, onCertificateCreated, addToast }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const request = useMemo(() => 
    requests.find(r => String(r.id) === id), 
    [requests, id]
  );

  if (!request) {
    return (
      <SinResultado icono="bi-search" texto="Solicitud no encontrada">
        <button type="button" onClick={() => navigate('/')} className="btn btn-primary">
          Volver a Solicitudes
        </button>
      </SinResultado>
    );
  }

  const handleDeleteAttachment = (attachmentId: number | string) => {
    if (onDeleteAttachment) {
      onDeleteAttachment(attachmentId, id);
    }
  };

  return (
    <BudgetDetails 
      user={user}
      request={request} 
      loading={loading}
      setLoading={setLoading}
      onBack={() => navigate('/')}
      onRequestUpdated={onRequestUpdated}
      onDeleteAttachment={handleDeleteAttachment}
      onCertificateCreated={onCertificateCreated}
      addToast={addToast}
    />
  );
};

interface BudgetConfirmViewProps {
  user: User;
  requests: BudgetRequest[];
  fetchAllRequests: () => void;
}

const BudgetConfirmView: React.FC<BudgetConfirmViewProps> = ({ user, requests, fetchAllRequests }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const request = useMemo(() =>
    requests.find(r => String(r.id) === id),
    [requests, id]
  );

  const isCompra = user.role === Role.COMPRA_RSS || user.role === Role.COMPRA_RSD || user.role === Role.COMPRA_RCO;

  useEffect(() => {
    if (!isCompra || !id) return;
    let cancelled = false;

    const runConfirmation = async () => {
      setConfirmLoading(true);
      setConfirmError(false);
      try {
        const result = await budgetService.confirmation(id);
        if (cancelled) return;
        if (!result.error) {
          await fetchAllRequests();
          if (!cancelled) setConfirmed(true);
        } else {
          setConfirmError(true);
        }
      } catch {
        if (!cancelled) setConfirmError(true);
      } finally {
        if (!cancelled) setConfirmLoading(false);
      }
    };

    runConfirmation();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!isCompra && request) {
    return (
      <BudgetDetails
        user={user}
        request={request}
        onBack={() => navigate('/')}
        onRequestUpdated={() => {}}
      />
    );
  }

  if (confirmLoading) {
    return null;
  }

  if (confirmError) {
    return (
      <SinResultado icono="bi-exclamation-circle" texto="No se pudo confirmar la solicitud">
        <button
          type="button"
          onClick={() => {
            setConfirmError(false);
            setConfirmLoading(true);
            budgetService.confirmation(id!).then(async (result) => {
              if (!result.error) {
                await fetchAllRequests();
                setConfirmed(true);
              } else {
                setConfirmError(true);
              }
            }).catch(() => setConfirmError(true))
              .finally(() => setConfirmLoading(false));
          }}
          className="btn btn-primary"
        >
          Reintentar
        </button>
      </SinResultado>
    );
  }

  if (!confirmed || !request) {
    return null;
  }

  return (
    <BudgetDetails
      user={user}
      request={request}
      onBack={() => navigate('/')}
      onRequestUpdated={() => {}}
    />
  );
};

interface BudgetFormViewProps {
  requests: BudgetRequest[];
  onSubmit: (formValues: any, id?: string) => Promise<void>;
  onCancel: () => void;
  onDeleteAttachment?: (id: number | string, requestId?: string) => void;
  addToast?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const BudgetFormView: React.FC<BudgetFormViewProps> = ({ requests, onSubmit, onCancel, onDeleteAttachment, addToast }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const initialData = useMemo(() => 
    id ? requests.find(r => String(r.id) === id) : undefined,
    [requests, id]
  );

  const handleSubmit = (formValues: any) => {
    onSubmit(formValues, id);
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <BudgetForm 
      initialData={initialData}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      onDeleteAttachment={onDeleteAttachment}
      addToast={addToast}
    />
  );
};

const AppContent: React.FC<{
  user: User;
  requests: BudgetRequest[];
  setRequests: React.Dispatch<React.SetStateAction<BudgetRequest[]>>;
  loading: boolean;
  setLoading: (l: boolean) => void;
  toasts: ToastType[];
  addToast: (m: string, t?: ToastType['type']) => void;
  removeToast: (id: string) => void;
  fetchAllRequests: () => void;
  handleApiError: (e: any, m?: string) => boolean;
  filters: { selectedYear: number; selectedMonth: number; statusFilter: BudgetStatus | 'TODOS' };
  setFilters: React.Dispatch<React.SetStateAction<{ selectedYear: number; selectedMonth: number; statusFilter: BudgetStatus | 'TODOS' }>>;
  lastUpdated: string | null;
}> = ({
  user, requests, setRequests, loading, setLoading,
  toasts, addToast, removeToast, fetchAllRequests, handleApiError, filters, setFilters, lastUpdated
}) => {
  const navigate = useNavigate();
  const { fetchCatalogs, loadingCatalogs } = useCatalogs();
  const fetchCalledRef = useRef(false);

  useEffect(() => {
    if (!fetchCalledRef.current) {
      fetchCalledRef.current = true;
      fetchAllRequests();
      fetchCatalogs();
    }
  }, [fetchAllRequests, fetchCatalogs]);

  const handleCreateRequest = async (formValues: any) => {
    setLoading(true);
        
    try {
      const formData = new FormData();

      formData.append('titulo', formValues.name);
      formData.append('descripcion', formValues.description);
      formData.append('tipo_solicitud', formValues.requestType);
      formData.append('rubro_presupuestal', formValues.budgetRubro);
      formData.append('monto_a_ejecutar', formValues.executionAmount);
      formData.append('presupuesto_pre_aprobado', formValues.preApprovedBudget);
      formData.append('ubicacion_id', formValues.locationId);
      formData.append('cuenta_analitica_id', formValues.analyticalAccountId);
      formData.append('fecha_actividad', formValues.activityDate);
      formValues.attachments.forEach((attachment) => {
        formData.append('files', attachment.file);
      });

      await budgetService.create(formData);
      
      await fetchAllRequests();      
      navigate('/');
      addToast('Solicitud enviada correctamente', 'success');
    } catch (error: any) {
      handleApiError(error, 'No se pudo crear la solicitud. Verifique los datos e intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRequest = async (formValues: any, id?: string) => {
    if (!user || !id) return;
    setLoading(true);
    try {
      const currentRequest = requests.find(r => String(r.id) === String(id));
      const formData = new FormData();

      formData.append('titulo', formValues.name);
      formData.append('descripcion', formValues.description);
      formData.append('tipo_solicitud', formValues.requestType);
      formData.append('rubro_presupuestal', formValues.budgetRubro);
      formData.append('monto_a_ejecutar', formValues.executionAmount);
      formData.append('presupuesto_pre_aprobado', formValues.preApprovedBudget);
      formData.append('ubicacion_id', formValues.locationId);
      formData.append('cuenta_analitica_id', formValues.analyticalAccountId);
      formData.append('updated_at', currentRequest?.updated_at || new Date().toISOString());
      formData.append('fecha_actividad', formValues.activityDate);
      formValues.attachments.forEach((attachment) => {
        formData.append('files', attachment.file);
      });

      await budgetService.update(id, formData as any);
      
      await fetchAllRequests();
      navigate('/');
      addToast('Solicitud actualizada correctamente', 'success');
    } catch (error: any) {
      if (error.status === 409) {
        addToast(error.data?.error || 'Versión desactualizada', 'warning');
        await fetchAllRequests();
        navigate('/');
      } else {
        handleApiError(error, 'Error al actualizar la solicitud. Por favor reintente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestUpdated = (updatedRequest: BudgetRequest) => {
    setRequests(prev => prev.map(r => 
      String(r.id) === String(updatedRequest.id) ? updatedRequest : r
    ));
  };

  const handleDeleteBudget = async (id: string) => {
    setLoading(true);
    try {
      await budgetService.delete(id);
      
      setRequests(prev => prev.filter(r => 
        String(r.id) !== String(id)
      ));
      addToast(`Solicitud eliminada con éxito`, 'success');
    } catch (error: any) {
      handleApiError(error, 'Error al eliminar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarAdjunto = async (id: number, requestId?: string) => {
    if (window.confirm('¿Estás seguro de eliminar el documento adjunto?')) { 
      try {             
        setLoading(true);
        await budgetService.deleteAttachment(id);
        setRequests(prev => prev.map(r => {
          if (String(r.id) === String(requestId)) {
            return {
              ...r,
              files: r.files ? r.files.filter(a => String(a.id) !== String(id)) : []
            };
          }
          return r;
        }));
        addToast(`Documento adjunto eliminado con éxito`, 'success');
      } catch (error: any) {
        handleApiError(error, 'Error al eliminar el documento adjunto.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCertificateCreated = async () => {
    await fetchAllRequests();
    addToast('Certificado generado correctamente', 'success');
  };

  // La barra lateral, la barra superior (avatar y «Cerrar sesión»), el menú y el pie están en SuiteLayout
  // (components/suite); aquí solo va el contenido de <main>.
  return (
    <>
      {(loading || loadingCatalogs) && (
        <div className="cep-cargando" role="status" aria-live="polite">
          <div className="spinner-border"><span className="visually-hidden">Cargando…</span></div>
        </div>
      )}

        <Routes>
          <Route path="/" element={
            <DashboardView 
              user={user} 
              requests={requests}
              filters={filters}
              onViewDetails={(id) => navigate(`/request/${id}`)}
              onEdit={(id) => navigate(`/request/${id}/edit`)}
              onDelete={handleDeleteBudget}
              onFiltersChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
              lastUpdated={lastUpdated}
            />
          } />
          <Route path="/create" element={
            <BudgetFormView 
              requests={requests}
              onSubmit={handleCreateRequest}
              onCancel={() => navigate('/')}
              onDeleteAttachment={handleEliminarAdjunto}
              addToast={addToast}
            />
          } />
          <Route path="/request/:id" element={
            <BudgetDetailsView 
              user={user}
              requests={requests}
              loading={loading}
              setLoading={setLoading}
              onRequestUpdated={handleRequestUpdated}
              onDeleteAttachment={handleEliminarAdjunto}
              onCertificateCreated={handleCertificateCreated}
              addToast={addToast}
            />
          } />
          <Route path="/request/:id/edit" element={
            <BudgetFormView
              requests={requests}
              onSubmit={handleEditRequest}
              onCancel={() => navigate('/')}
              onDeleteAttachment={handleEliminarAdjunto}
              addToast={addToast}
            />
          } />
          <Route path="/request/:id/confirm" element={
            <BudgetConfirmView
              user={user}
              requests={requests}
              fetchAllRequests={fetchAllRequests}
            />
          } />
          <Route path="/certificado-preview" element={
            <CertificatePreview />
          } />
          <Route path="/administracion/*" element={
            <Administracion user={user} avisar={addToast} onError={handleApiError} onCambioCatalogos={fetchCatalogs} />
          } />
          <Route path="*" element={
            <SinResultado icono="bi-signpost-split" texto="Página no encontrada">
              <button type="button" onClick={() => navigate('/')} className="btn btn-primary">
                Volver a Solicitudes
              </button>
            </SinResultado>
          } />
        </Routes>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

const App: React.FC<{ user: User }> = ({ user }) => {
  const [requests, setRequests] = useState<BudgetRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    selectedYear: new Date().getFullYear(),
    selectedMonth: new Date().getMonth() + 1,
    statusFilter: 'TODOS' as BudgetStatus | 'TODOS'
  });

  const addToast = useCallback((message: string, type: ToastType['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration: 4000 }]);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleApiError = useCallback((error: any, customMessage?: string) => {
    if (error.status === 401) {
      // La sesión terminó (aquí o en otra app de la suite): se vuelve a entrar por la ventana de acceso.
      irAlLogin();
      return true;
    }
    console.error("API Error context:", error);
    addToast(customMessage || `Error: ${error.message}`, 'error');
    return false;
  }, [addToast]);

  const fetchAllRequests = useCallback(async () => {
    setLoading(true);
    try {
      const {solicitudes, last_updated} = await budgetService.getAll();   
      setLastUpdated(last_updated);   
      setRequests(solicitudes);
    } catch (error: any) {
      handleApiError(error, 'No se pudieron cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const refreshSolicitudes = useCallback(async () => {
    try {
      const { solicitudes, last_updated } = await budgetService.refreshSolicitudes(lastUpdated);
      setRequests(prev => {
        const merged = [...prev];
        solicitudes.forEach(incoming => {
          const idx = merged.findIndex(r => String(r.id) === String(incoming.id));
          if (idx >= 0) {
            merged[idx] = incoming;
          } else {
            merged.unshift(incoming);
          }
        });
        return merged;
      });
      setLastUpdated(last_updated);
    } catch (error: any) {
      console.error('Error al refrescar solicitudes:', error);
    }
  }, [lastUpdated]);

  useEffect(() => {
    const interval = setInterval(() => {
      const path = window.location.pathname;
      if (path === '/create' || /^\/request\/\d+\/edit$/.test(path)) return;
      refreshSolicitudes();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshSolicitudes]);

  return (
    <CatalogProvider>
      <AppContent
        user={user}
        requests={requests}
        setRequests={setRequests}
        loading={loading}
        setLoading={setLoading}
        toasts={toasts}
        addToast={addToast}
        removeToast={removeToast}
        fetchAllRequests={fetchAllRequests}
        handleApiError={handleApiError}
        filters={filters}
        setFilters={setFilters}
        lastUpdated={lastUpdated}
      />
    </CatalogProvider>
  );
};

export default App;
