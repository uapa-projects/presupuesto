import React, { memo, useEffect, useState } from 'react';
import { Sesion } from '../../services/session';
import { APP_BASENAME, rutaApp } from '../../config';
import { iniciarSuite } from '../../services/suite';
import { nombreDelRol, rutaDe, useRolEnPerfil, useSuiteShell } from '../../hooks/useSuiteShell';
import Subnav from './Subnav';
import AccesoModal from './AccesoModal';

/** JSON dentro de <script>: sin «<» literal, para que ningún texto (p. ej. un nombre) pueda cerrar la etiqueta. */
export const jsonSeguro = (datos: unknown) => JSON.stringify(datos).replace(/</g, '\\u003c');

// Botón «Iniciar sesión» de la barra superior sin sesión: suite-shell.js lo toma de este <template> (lee
// template.content, por eso va como HTML y no como JSX). acceso.js abre la ventana con data-acceso-abrir.
const SLOT_SIN_SESION =
  '<template data-suite-slot="sin-sesion">' +
  `<a href="${APP_BASENAME}?acceder=" class="btn btn-primary btn-sm" data-acceso-abrir>Iniciar sesión</a></template>`;

/**
 * Contenedores de UAPA Suite. React los dibuja vacíos una sola vez y suite-shell.js los llena (barra lateral,
 * barra superior con la ruta y el usuario, pie): `memo` sin props hace que React no vuelva a tocarlos.
 */
const Barra = memo(() => (
  <aside className="suite-sidebar offcanvas-md offcanvas-start" tabIndex={-1} id="sidebar"
         aria-label="Navegación de la suite" data-suite-shell="sidebar" />
));
const Superior = memo(() => (
  <header className="suite-topbar" data-suite-shell="topbar" dangerouslySetInnerHTML={{ __html: SLOT_SIN_SESION }} />
));
const Pie = memo(() => <footer className="suite-footer" data-suite-shell="footer" />);
const Config = memo(({ json, id }: { json: string; id: string }) => (
  <script type="application/json" id={id} dangerouslySetInnerHTML={{ __html: json }} />
));

/**
 * Solo en desarrollo (npm run dev): auth_service no permite por CORS el origen de Vite (localhost:3000), así que
 * el catálogo de apps de la barra lateral no llegaría. suite-shell.js lo pide entonces a /plataforma-auth, que
 * Vite reenvía a auth_service (vite.config.ts). En el build no cambia nada.
 */
const configShell = (shell: Sesion['shell']) =>
  import.meta.env.DEV ? { ...shell, authUrl: '/plataforma-auth' } : shell;

const Mensajes: React.FC<{ mensajes: Sesion['mensajes'] }> = ({ mensajes }) => {
  const [visibles, setVisibles] = useState(mensajes);
  return (
    <>
      {visibles.map((m, i) => (
        <div key={i} className="alert alert-suite alert-dismissible" role="status">
          {m.texto}
          <button type="button" className="btn-close" aria-label="Cerrar"
                  onClick={() => setVisibles((v) => v.filter((x) => x !== m))} />
        </div>
      ))}
    </>
  );
};

const SuiteLayout: React.FC<{ sesion: Sesion; children: React.ReactNode }> = ({ sesion, children }) => {
  const { usuario, acceso } = sesion;
  useSuiteShell(Boolean(usuario));
  useRolEnPerfil(usuario ? nombreDelRol(usuario.role, usuario.administrador) : null);

  useEffect(() => {
    const ruta = usuario ? rutaDe(rutaApp(window.location.pathname)) : '';
    iniciarSuite(sesion.static, ruta, acceso ? { google: Boolean(acceso.google_client_id) } : null)
      .catch((e) => console.error('UAPA Suite:', e));
  }, [sesion.static, usuario, acceso]);

  return (
    <>
      <Barra />
      <div className="suite-main">
        <Superior />
        {usuario && <Subnav usuario={usuario} />}
        <main className="suite-content mx-auto">
          <Mensajes mensajes={sesion.mensajes} />
          {children}
          <p className="cep-ayuda"><i className="bi bi-info-circle" aria-hidden="true"></i>{' '}
            ¿Necesitas asistencia? Llama a la sede <strong>Ext. 378</strong> o Flota: <strong>829-901-2885</strong></p>
        </main>
        <Pie />
      </div>
      <Config id="suite-shell-config" json={jsonSeguro(configShell(sesion.shell))} />
      {acceso && (
        <>
          <AccesoModal acceso={acceso} csrf={sesion.csrf} stat={sesion.static} />
          <Config id="suite-rutas-privadas" json={jsonSeguro(acceso.rutas_privadas)} />
        </>
      )}
    </>
  );
};

export default SuiteLayout;
