import React, { useState, useEffect } from 'react';
import Select from "react-select";
import { BudgetRequest, Attachment } from '../types';
import { useCatalogs } from '../context/CatalogContext';
import { budgetService } from '../services/budget.service';
import AttachmentList from './AttachmentList';
import { selectStyles } from '../utils/selectStyles';
interface BudgetFormProps {
  initialData?: BudgetRequest;
  onCancel: () => void;
  onSubmit: (data: any) => void;
  onDeleteAttachment?: (id: number | string, budgetId?: string) => Promise<void> | void;
  addToast?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const getLocalDateString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().split('T')[0];
};

const parseServerDate = (serverDate: string | undefined): string => {
  if (!serverDate) return getLocalDateString();
  return serverDate.split('T')[0];
};

const BudgetForm: React.FC<BudgetFormProps> = ({ initialData, onCancel, onSubmit, onDeleteAttachment, addToast }) => {
  const { ubicaciones, cuentasAnaliticas, loadingCatalogs, TIPO_CHOICES, RUBRO_CHOICES } = useCatalogs();

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: initialData?.titulo || '',
    description: initialData?.descripcion || '',
    activityDate: parseServerDate(initialData?.fecha_actividad),
    locationId: initialData?.ubicacion?.id || '',
    requestType: initialData?.tipo_solicitud || '',
    budgetRubro: initialData?.rubro_presupuestal || '',
    analyticalAccountId: initialData?.cuenta_analitica?.id || '',
    preApprovedBudget: initialData?.presupuesto_pre_aprobado || '',
    executionAmount: initialData?.monto_a_ejecutar || '',
    files: initialData?.files || [],
  });
  
  const handleDeleteAttachment = async (id: number | string) => {
    if (onDeleteAttachment && initialData?.id) {
      await onDeleteAttachment(id, String(initialData.id));
      setFormData(prev => ({
        ...prev,
        files: prev.files?.filter(f => String((f as any).id ?? (f as any).name ?? '') !== String(id)) || []
      }));
    }
  };
  const [attachments, setAttachments] = useState<Attachment[]>(initialData?.attachments || []);

  useEffect(() => {
    setFormData({
      name: initialData?.titulo || '',
      description: initialData?.descripcion || '',      
      activityDate: parseServerDate(initialData?.fecha_actividad),
      locationId: initialData?.ubicacion?.id || '',
      requestType: initialData?.tipo_solicitud || '',
      budgetRubro: initialData?.rubro_presupuestal || '',
      analyticalAccountId: initialData?.cuenta_analitica?.id || '',
      preApprovedBudget: initialData?.presupuesto_pre_aprobado || '',
      executionAmount: initialData?.monto_a_ejecutar || '',
      files: initialData?.files || [],
    });
    setFormErrors({});
  }, [initialData, initialData?.files]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const MAX_FILES = 2; 
    const MAX_TOTAL_SIZE_MB = 10;
    const MAX_TOTAL_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024; // Convertir MB a Bytes
    const selectedFiles: File[] = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) return;
    if (selectedFiles.length > MAX_FILES) {      
        addToast && addToast(`Solo puedes subir un máximo de ${MAX_FILES} archivos.`, 'error');
        e.target.value = ""; 
        return;
    }
    const totalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);
    if (totalSize > MAX_TOTAL_BYTES) {
      addToast && addToast(`El tamaño total de los archivos excede el límite de ${MAX_TOTAL_SIZE_MB} MB.`, 'error');
      e.target.value = "";
      return;
    }
    const newFiles: Attachment[] = selectedFiles.map((f: File) => ({
      name: f.name,
      size: `${(f.size / 1024).toFixed(1)} KB`,
      type: f.type,
      file: f
    }));
    setAttachments(prev => [...prev, ...newFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!formData.name) errors['name'] = 'Este campo es obligatorio';
    if (!formData.description) errors['description'] = 'Este campo es obligatorio';
    if (!formData.locationId) errors['locationId'] = 'Seleccione una ubicación';
    if (!formData.requestType) errors['requestType'] = 'Seleccione un tipo de solicitud';
    if (!formData.budgetRubro) errors['budgetRubro'] = 'Seleccione un rubro presupuestal';
    if (!formData.analyticalAccountId) errors['analyticalAccountId'] = 'Seleccione una cuenta analítica';
    if (formData.executionAmount === '' || formData.executionAmount === 0) errors['executionAmount'] = 'Este campo es obligatorio';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      if (addToast) {
        addToast('Por favor complete todos los campos obligatorios', 'error');
      }
      return;
    }
    setFormErrors({});

    const loc = ubicaciones.find(u => String(u.id) === String(formData.locationId));
    const acc = cuentasAnaliticas.find(a => a.id === Number(formData.analyticalAccountId));

    onSubmit({
      ...formData,
      activityDate: formData.activityDate,
      preApprovedBudget: formData.preApprovedBudget === '' ? 0 : formData.preApprovedBudget,
      executionAmount: formData.executionAmount === '' ? 0 : formData.executionAmount,
      locationName: loc?.nombre || 'Sede Santiago',
      analyticalAccountName: acc?.nombre || 'Cuenta Analítica',
      attachments
    });
  };

  const getFieldError = (field: string) => formErrors[field];
  const getFieldClass = (field: string, base: string) => (formErrors[field] ? `${base} is-invalid` : base);
  const limpiarError = (field: string) => {
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }));
  };
  const ErrorCampo = ({ field }: { field: string }) =>
    getFieldError(field) ? <div className="invalid-feedback d-block">{getFieldError(field)}</div> : null;

  const cuentaActual = cuentasAnaliticas.find(c => c.id === Number(formData.analyticalAccountId));

  return (
    <div className="cep-lectura">
      <div className="cep-encabezado">
        <button type="button" onClick={onCancel} className="icon-btn" aria-label="Volver a Solicitudes" title="Volver">
          <i className="bi bi-arrow-left" aria-hidden="true"></i>
        </button>
        <div className="cep-encabezado-texto">
          <h1 className="page-title">
            {initialData ? 'Editar solicitud' : 'Nueva solicitud de presupuesto'}
          </h1>
          <p className="page-sub mb-0">Complete la información detallada para que administración pueda evaluar su caso.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="suite-card cep-form" noValidate>
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label" htmlFor="sol-concepto">Concepto *</label>
            <input
              id="sol-concepto"
              type="text"
              required
              value={formData.name}
              onChange={e => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                limpiarError('name');
              }}
              placeholder="Ej. Taller de capacitación docente"
              className={getFieldClass('name', 'form-control')}
            />
            <ErrorCampo field="name" />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="sol-ubicacion">Ubicación *</label>
            <select
              id="sol-ubicacion"
              value={formData.locationId}
              onChange={e => {
                setFormData(prev => ({ ...prev, locationId: e.target.value }));
                limpiarError('locationId');
              }}
              className={getFieldClass('locationId', 'form-select')}
              disabled={loadingCatalogs}
            >
              <option value="">Seleccione una opción</option>
              {ubicaciones.length > 0 ? (
                ubicaciones.map(u => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))
              ) : (
                <option value="">Cargando ubicaciones...</option>
              )}
            </select>
            <ErrorCampo field="locationId" />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="sol-fecha">Fecha de actividad *</label>
            <input
              id="sol-fecha"
              type="date"
              required
              value={formData.activityDate}
              onChange={e => {
                setFormData(prev => ({ ...prev, activityDate: e.target.value }));
                limpiarError('activityDate');
              }}
              className={getFieldClass('activityDate', 'form-control')}
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="sol-tipo">Tipo de solicitud *</label>
            <select
              id="sol-tipo"
              value={formData.requestType}
              onChange={e => {
                setFormData(prev => ({ ...prev, requestType: e.target.value }));
                limpiarError('requestType');
              }}
              className={getFieldClass('requestType', 'form-select')}
            >
              <option value="">Seleccione una opción</option>
              {TIPO_CHOICES.map(choice => (
                <option key={choice.value} value={choice.value}>{choice.label}</option>
              ))}
            </select>
            <ErrorCampo field="requestType" />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="sol-rubro">Rubro presupuestal *</label>
            <select
              id="sol-rubro"
              value={formData.budgetRubro}
              onChange={e => {
                setFormData(prev => ({ ...prev, budgetRubro: e.target.value }));
                limpiarError('budgetRubro');
              }}
              className={getFieldClass('budgetRubro', 'form-select')}
            >
              <option value="">Seleccione una opción</option>
              {RUBRO_CHOICES.map(choice => (
                <option key={choice.value} value={choice.value}>{choice.label}</option>
              ))}
            </select>
            <ErrorCampo field="budgetRubro" />
          </div>

          <div className="col-12">
            <label className="form-label" htmlFor="sol-cuenta">Cuenta analítica *</label>
            <Select
              inputId="sol-cuenta"
              styles={selectStyles(!!getFieldError('analyticalAccountId'))}
              defaultValue={formData.analyticalAccountId ? {value: formData.analyticalAccountId, label: cuentaActual ? `${cuentaActual.codigo} - ${cuentaActual.nombre}` : 'Cargando...'} : null}
              onChange={(newValue) => {
                setFormData(prev => ({ ...prev, analyticalAccountId: newValue.value }));
                limpiarError('analyticalAccountId');
              }}
              options={cuentasAnaliticas.map(c=>({value: c.id, label: `${c.codigo} - ${c.nombre}`}))} placeholder="Seleccione la cuenta..." />
            <ErrorCampo field="analyticalAccountId" />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="sol-presupuesto">Presupuesto pre-aprobado (RD$) *</label>
            <input
              id="sol-presupuesto"
              type="number"
              min="0"
              step="0.01"
              value={formData.preApprovedBudget}
              onChange={e => {
                setFormData(prev => ({ ...prev, preApprovedBudget: e.target.value === '' ? '' : Number(e.target.value) }));
                limpiarError('preApprovedBudget');
              }}
              className={getFieldClass('preApprovedBudget', 'form-control')}
              placeholder="0"
            />
            <ErrorCampo field="preApprovedBudget" />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="sol-monto">Monto a ejecutar (RD$) *</label>
            <input
              id="sol-monto"
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.executionAmount}
              onChange={e => {
                setFormData(prev => ({ ...prev, executionAmount: e.target.value === '' ? '' : Number(e.target.value) }));
                limpiarError('executionAmount');
              }}
              className={getFieldClass('executionAmount', 'form-control')}
              placeholder="0"
            />
            <ErrorCampo field="executionAmount" />
          </div>

          <div className="col-12">
            <label className="form-label" htmlFor="sol-descripcion">Descripción detallada *</label>
            <textarea
              id="sol-descripcion"
              required
              rows={4}
              value={formData.description}
              onChange={e => {
                setFormData(prev => ({ ...prev, description: e.target.value }));
                limpiarError('description');
              }}
              placeholder="Explique el propósito de este gasto..."
              className={getFieldClass('description', 'form-control')}
            />
            <ErrorCampo field="description" />
          </div>

          <div className="col-12">
            <span className="form-label d-block">Documentación adjunta</span>
            <div className="d-grid gap-3">
              <AttachmentList
                files={formData.files}
                onDeleteAttachment={handleDeleteAttachment}
              />
              <div className="cep-adjuntar">
                <input type="file" multiple onChange={handleFileChange} aria-label="Adjuntar cotizaciones" />
                <i className="bi bi-cloud-arrow-up" aria-hidden="true"></i>
                <span className="small fw-medium">Haga clic o arrastre sus cotizaciones aquí (máximo 2 archivos, 10 MB)</span>
              </div>

              {attachments.length > 0 && (
                <div className="cep-archivos">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="cep-archivo">
                      <i className="bi bi-paperclip" aria-hidden="true"></i>
                      <span className="cep-archivo-nombre" title={file.name}>{file.name}</span>
                      <button type="button" onClick={() => removeAttachment(idx)} className="icon-btn cep-peligro"
                              aria-label={`Quitar ${file.name}`} title="Quitar">
                        <i className="bi bi-x-lg" aria-hidden="true"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="cep-form-pie">
          <button type="button" onClick={onCancel} className="btn btn-outline-suite">
            Cancelar
          </button>
          <button type="submit" disabled={loadingCatalogs} className="btn btn-primary">
            {initialData ? 'Guardar cambios' : 'Enviar solicitud'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BudgetForm;
