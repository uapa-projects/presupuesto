import React, { memo } from 'react';
import { Acceso } from '../../services/session';

/**
 * Ventana de acceso de UAPA Suite. La maneja acceso.js (static_service): la abre con «Iniciar sesión» o con
 * ?acceder=…, envía el formulario por fetch y, si Django responde {ok, next}, recarga en ese destino.
 * acceso.js lee estos nombres y atributos: no los cambies. Los campos no son controlados (acceso.js los llena).
 */
const AccesoModal: React.FC<{ acceso: Acceso; csrf: string; stat: string }> = ({ acceso, csrf, stat }) => (
  <div className="modal fade" id="acceso" tabIndex={-1} aria-labelledby="acceso-titulo" aria-hidden="true">
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content login-popup">
        <button type="button" className="btn-close position-absolute top-0 end-0 m-3" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        <div className="text-center mb-4">
          <span className="suite-logo mx-auto mb-3"><img src={`${stat}/img/cep.png`} alt="CEP" /></span>
          <h2 className="h4 fw-bold mb-1" id="acceso-titulo">Iniciar sesión</h2>
          <p className="text-muted small mb-0">Usa tu cuenta institucional de UAPA.</p>
        </div>
        <div className="alert alert-danger py-2 small" role="alert" data-acceso-error hidden></div>
        {acceso.google_client_id && (
          <>
            <div className="login-google" data-google data-client-id={acceso.google_client_id} data-url={acceso.google}></div>
            <div className="login-sep"><span>o</span></div>
          </>
        )}
        <form method="post" action={acceso.login}>
          <input type="hidden" name="csrfmiddlewaretoken" defaultValue={csrf} />
          <input type="hidden" name="next" defaultValue="" />
          <input className="form-control mb-2" name="username" placeholder="Correo institucional"
                 aria-label="Correo institucional" autoComplete="username" required />
          <input className="form-control mb-3" type="password" name="password" placeholder="Contraseña"
                 aria-label="Contraseña" autoComplete="current-password" required />
          <button className="btn btn-primary w-100 py-2">Entrar</button>
        </form>
      </div>
    </div>
  </div>
);

// Se dibuja una vez: acceso.js y Bootstrap manejan su estado (clases show, valores de los campos).
export default memo(AccesoModal);
