import React, { useCallback, useEffect, useState } from 'react';
import { adminService, mensajeDe, Parametro } from '../../services/admin.service';
import { Aviso } from './Administracion';

/** Parámetros de CEP (modelo Configuracion). Solo Administrador. Las contraseñas no se muestran ni se editan. */
const Parametros: React.FC<{ avisar: Aviso; onError: (e: any) => boolean }> = ({ avisar, onError }) => {
  const [parametros, setParametros] = useState<Parametro[] | null>(null);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const lista = await adminService.parametros();
      setParametros(lista);
      setValores(Object.fromEntries(lista.map((p) => [p.nombre, p.valor])));
    } catch (e) {
      if (!onError(e)) avisar(mensajeDe(e, 'No se pudieron cargar los parámetros.'), 'error');
      setParametros([]);
    }
  }, [avisar, onError]);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async (p: Parametro) => {
    setGuardando(p.nombre);
    try {
      const nuevo = await adminService.editarParametro(p.nombre, valores[p.nombre] ?? '');
      setParametros((lista) => (lista || []).map((x) => (x.nombre === p.nombre ? nuevo : x)));
      setValores((v) => ({ ...v, [p.nombre]: nuevo.valor }));
      avisar(`Se guardó ${p.nombre}.`, 'success');
    } catch (e) {
      if (!onError(e)) avisar(mensajeDe(e, 'No se pudo guardar el parámetro.'), 'error');
    } finally {
      setGuardando(null);
    }
  };

  if (parametros === null) {
    return <div className="text-center py-5"><div className="spinner-border" role="status"><span className="visually-hidden">Cargando…</span></div></div>;
  }

  return (
    <>
      <p className="cep-aviso cep-adm-nota">
        <i className="bi bi-shield-lock" aria-hidden="true"></i>{' '}
        La contraseña de la cuenta de servicio no aparece aquí: se carga en el servidor con{' '}
        <code>manage.py clave_servicio</code>. Cambiar los parámetros de la plataforma puede dejar a todos sin acceso.
      </p>
      <ul className="cep-adm-lista" aria-label="Parámetros">
        {parametros.map((p) => {
          const cambiado = (valores[p.nombre] ?? '') !== p.valor;
          return (
            <li key={p.nombre} className="suite-card cep-adm-parametro">
              <form onSubmit={(ev) => { ev.preventDefault(); guardar(p); }}>
                <label className="form-label cep-adm-codigo" htmlFor={`p-${p.nombre}`}>{p.nombre}</label>
                {p.descripcion && <p className="cep-persona-sub mb-2" id={`d-${p.nombre}`}>{p.descripcion}</p>}
                <div className="input-group">
                  <input id={`p-${p.nombre}`} className="form-control" maxLength={100}
                         aria-describedby={p.descripcion ? `d-${p.nombre}` : undefined}
                         value={valores[p.nombre] ?? ''}
                         onChange={(e) => setValores({ ...valores, [p.nombre]: e.target.value })} />
                  <button type="submit" className="btn btn-primary" disabled={!cambiado || guardando === p.nombre}>
                    Guardar
                  </button>
                </div>
              </form>
            </li>
          );
        })}
      </ul>
    </>
  );
};

export default Parametros;
