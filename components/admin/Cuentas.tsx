import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminService, CuentaAdmin, mensajeDe, TipoCuenta } from '../../services/admin.service';
import { Aviso } from './Administracion';

interface Props {
  tipo: TipoCuenta;
  singular: string;              // «cuenta analítica»
  avisar: Aviso;
  onCambio: () => void;          // refresca los catálogos del formulario de solicitudes
  onError: (e: any) => boolean;  // 401 → ventana de acceso
}

const VACIA = { codigo: '', nombre: '' };

/** Lista, alta, edición y baja de cuentas (analíticas o contables). */
const Cuentas: React.FC<Props> = ({ tipo, singular, avisar, onCambio, onError }) => {
  const [cuentas, setCuentas] = useState<CuentaAdmin[] | null>(null);
  const [filtro, setFiltro] = useState('');
  const [nueva, setNueva] = useState(VACIA);
  const [editando, setEditando] = useState<number | null>(null);
  const [borrador, setBorrador] = useState(VACIA);
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCuentas(await adminService.cuentas(tipo));
    } catch (e) {
      if (!onError(e)) avisar(mensajeDe(e, 'No se pudieron cargar las cuentas.'), 'error');
      setCuentas([]);
    }
  }, [tipo, avisar, onError]);

  useEffect(() => { setCuentas(null); setEditando(null); setFiltro(''); cargar(); }, [cargar]);

  const visibles = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    return (cuentas || []).filter((c) => !q || c.codigo.toLowerCase().includes(q) || c.nombre.toLowerCase().includes(q));
  }, [cuentas, filtro]);

  const accion = async (fn: () => Promise<unknown>, exito: string, falla: string) => {
    setOcupado(true);
    try {
      await fn();
      avisar(exito, 'success');
      onCambio();
      await cargar();
      return true;
    } catch (e) {
      if (!onError(e)) avisar(mensajeDe(e, falla), 'error');
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const crear = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (await accion(() => adminService.crearCuenta(tipo, nueva), `Se agregó la ${singular}.`, 'No se pudo agregar.')) {
      setNueva(VACIA);
    }
  };

  const guardar = async (id: number) => {
    if (await accion(() => adminService.editarCuenta(tipo, id, borrador), 'Cambios guardados.', 'No se pudo guardar.')) {
      setEditando(null);
    }
  };

  const eliminar = (c: CuentaAdmin) => {
    if (!window.confirm(`¿Eliminar la ${singular} «${c.codigo} - ${c.nombre}»?`)) return;
    accion(() => adminService.eliminarCuenta(tipo, c.id), `Se eliminó la ${singular}.`, 'No se pudo eliminar.');
  };

  return (
    <>
      <form className="suite-card cep-adm-alta" onSubmit={crear}>
        <h2 className="cep-seccion-titulo mb-3">Agregar {singular}</h2>
        <div className="cep-adm-campos">
          <div>
            <label className="form-label" htmlFor={`${tipo}-codigo`}>Código</label>
            <input id={`${tipo}-codigo`} className="form-control" maxLength={20} required
                   value={nueva.codigo} onChange={(e) => setNueva({ ...nueva, codigo: e.target.value })} />
          </div>
          <div className="cep-adm-nombre">
            <label className="form-label" htmlFor={`${tipo}-nombre`}>Nombre</label>
            <input id={`${tipo}-nombre`} className="form-control" maxLength={100} required
                   value={nueva.nombre} onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={ocupado}>
            <i className="bi bi-plus-lg" aria-hidden="true"></i>Agregar
          </button>
        </div>
      </form>

      <div className="cep-filtro mt-4" role="search">
        <div className="cep-buscar">
          <label className="form-label" htmlFor={`${tipo}-buscar`}>Buscar</label>
          <div className="input-group">
            <span className="input-group-text"><i className="bi bi-search" aria-hidden="true"></i></span>
            <input id={`${tipo}-buscar`} type="search" className="form-control" placeholder="Código o nombre"
                   value={filtro} onChange={(e) => setFiltro(e.target.value)} />
          </div>
        </div>
      </div>

      {cuentas === null ? (
        <div className="text-center py-5"><div className="spinner-border" role="status"><span className="visually-hidden">Cargando…</span></div></div>
      ) : visibles.length === 0 ? (
        <div className="suite-card cep-vacio">
          <i className="bi bi-inbox" aria-hidden="true"></i>
          <p className="page-sub mt-2 mb-0">{filtro ? 'Ninguna cuenta coincide con la búsqueda.' : 'Todavía no hay cuentas.'}</p>
        </div>
      ) : (
        <ul className="cep-adm-lista" aria-label="Cuentas">
          {visibles.map((c) => (
            <li key={c.id} className="suite-card cep-adm-fila">
              {editando === c.id ? (
                <form className="cep-adm-campos" onSubmit={(ev) => { ev.preventDefault(); guardar(c.id); }}>
                  <div>
                    <label className="form-label" htmlFor={`e-codigo-${c.id}`}>Código</label>
                    <input id={`e-codigo-${c.id}`} className="form-control" maxLength={20} required autoFocus
                           value={borrador.codigo} onChange={(e) => setBorrador({ ...borrador, codigo: e.target.value })} />
                  </div>
                  <div className="cep-adm-nombre">
                    <label className="form-label" htmlFor={`e-nombre-${c.id}`}>Nombre</label>
                    <input id={`e-nombre-${c.id}`} className="form-control" maxLength={100} required
                           value={borrador.nombre} onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })} />
                  </div>
                  <div className="cep-adm-botones">
                    <button type="submit" className="btn btn-primary" disabled={ocupado}>Guardar</button>
                    <button type="button" className="btn btn-outline-suite" onClick={() => setEditando(null)}>Cancelar</button>
                  </div>
                </form>
              ) : (
                <>
                  <span className="cep-adm-codigo">{c.codigo}</span>
                  <span className="cep-adm-texto">{c.nombre}</span>
                  {c.en_uso && <span className="badge text-bg-light cep-adm-uso" title="Tiene solicitudes: no se puede eliminar">En uso</span>}
                  <span className="cep-adm-botones">
                    <button type="button" className="icon-btn" aria-label={`Editar ${c.codigo}`} title="Editar"
                            onClick={() => { setEditando(c.id); setBorrador({ codigo: c.codigo, nombre: c.nombre }); }}>
                      <i className="bi bi-pencil" aria-hidden="true"></i>
                    </button>
                    <button type="button" className="icon-btn cep-peligro" aria-label={`Eliminar ${c.codigo}`}
                            title={c.en_uso ? 'Tiene solicitudes: no se puede eliminar' : 'Eliminar'}
                            disabled={c.en_uso || ocupado} onClick={() => eliminar(c)}>
                      <i className="bi bi-trash" aria-hidden="true"></i>
                    </button>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default Cuentas;
