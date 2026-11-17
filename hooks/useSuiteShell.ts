import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Ruta «UAPA Suite › CEP › …» de la barra superior. suite-shell.js la pinta una vez al cargar (data-ruta);
 * al navegar dentro de React se actualiza aquí, porque suite-shell.js no tiene una función para cambiarla.
 */
const RUTAS: [RegExp, string][] = [
  [/^\/$/, 'Solicitudes'],
  [/^\/create\/?$/, 'Solicitudes › Nueva solicitud'],
  [/^\/request\/[^/]+\/edit\/?$/, 'Solicitudes › Editar solicitud'],
  [/^\/request\/[^/]+\/confirm\/?$/, 'Solicitudes › Confirmar solicitud'],
  [/^\/request\/[^/]+\/?$/, 'Solicitudes › Detalle de la solicitud'],
  [/^\/certificado-preview\/?$/, 'Certificado › Vista previa'],
  [/^\/administracion\/cuentas-analiticas\/?$/, 'Administración › Cuentas analíticas'],
  [/^\/administracion\/cuentas-contables\/?$/, 'Administración › Cuentas contables'],
  [/^\/administracion\/parametros\/?$/, 'Administración › Parámetros'],
  [/^\/administracion(\/.*)?$/, 'Administración'],
];

export const rutaDe = (path: string) => RUTAS.find(([patron]) => patron.test(path))?.[1] ?? '';

// Mismo HTML que pintarRuta() de suite-shell.js: intermedios solo desde md, el último desde sm.
function pintarRuta(ruta: string) {
  const nav = document.querySelector('[data-suite-shell="topbar"] .suite-brand');
  const pasos = ruta.split('›').map((p) => p.trim()).filter(Boolean);
  document.title = `${pasos[pasos.length - 1] || 'Inicio'} · CEP · UAPA Suite`;
  if (!nav) return;
  nav.querySelectorAll(':scope > .suite-ruta-sep, :scope > .suite-ruta-paso, :scope > .suite-ruta-actual')
    .forEach((n) => n.remove());
  pasos.forEach((texto, i) => {
    const ultimo = i === pasos.length - 1;
    const vis = ultimo ? 'd-none d-sm-inline' : 'd-none d-md-inline';
    const sep = document.createElement('i');
    sep.className = `bi bi-chevron-right suite-ruta-sep ${vis}`;
    sep.setAttribute('aria-hidden', 'true');
    const paso = document.createElement('span');
    paso.className = `${ultimo ? 'suite-ruta-actual text-truncate' : 'suite-ruta-paso text-nowrap'} ${vis}`;
    if (ultimo) paso.setAttribute('aria-current', 'page');
    paso.textContent = texto;
    nav.append(sep, paso);
  });
}

/** Sin sesión, la única pantalla es la portada: la ruta queda en «UAPA Suite › CEP». */
export function useSuiteShell(conSesion: boolean) {
  const { pathname } = useLocation();

  useEffect(() => {
    const pintar = () => pintarRuta(conSesion ? rutaDe(pathname) : '');
    pintar();
    // Si suite-shell.js termina de pintar después de navegar, se vuelve a poner la ruta de esta pantalla.
    document.addEventListener('suite-shell:listo', pintar);
    return () => document.removeEventListener('suite-shell:listo', pintar);
  }, [pathname, conSesion]);
}

/** Nombre del rol para mostrar debajo del nombre del usuario. */
export function nombreDelRol(role: string, administrador?: boolean): string {
  if (administrador) return 'Administrador';
  const nombres: Record<string, string> = {
    SUPERVISOR: 'Supervisor',
    'COMPRA RSS': 'Compra RSS',
    'COMPRA RSD': 'Compra RSD',
    'COMPRA RCO': 'Compra RCO',
    COLABORADOR: 'Colaborador',
  };
  return nombres[role] ?? role;
}

/**
 * Rol del usuario debajo de su nombre en la barra superior (clase .user-role de suite.css). suite-shell.js dibuja
 * el nombre y no tiene un campo para el rol, así que se agrega aquí y se vuelve a poner si lo redibuja.
 */
export function useRolEnPerfil(rol: string | null) {
  useEffect(() => {
    if (!rol) return;
    const poner = () => {
      const nombre = document.querySelector('[data-suite-usuario] .user-name');
      if (!nombre) return;
      const actual = nombre.parentElement?.querySelector('.user-role');
      if (actual?.textContent === rol) return;
      actual?.remove();
      const span = document.createElement('span');
      span.className = 'user-role d-block';
      span.textContent = rol;
      nombre.after(span);
    };
    poner();
    // El contenedor del usuario lo crea suite-shell.js dentro de la barra superior (la dibuja React): se observa la barra.
    const barra = document.querySelector('[data-suite-shell="topbar"]');
    if (!barra) return;
    const observador = new MutationObserver(poner);
    observador.observe(barra, { childList: true, subtree: true });
    return () => observador.disconnect();
  }, [rol]);
}
