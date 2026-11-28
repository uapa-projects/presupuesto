import { Role, User } from '../types';
import { APP_BASENAME, APP_SLUG, PLATFORM_AUTH_URL } from '../config';

/**
 * Sesión de CEP. La autentica la plataforma (auth_service) a través de Django: React no guarda tokens.
 * GET /api/sesion/ trae todo lo que la interfaz necesita para dibujarse dentro de UAPA Suite.
 */
interface UsuarioServidor {
  id: number;
  name: string;
  email: string;
  role: string;
  administrador?: boolean;
  picture: string;
}

export interface Acceso {
  login: string;
  google: string;
  google_client_id: string;
  rutas_privadas: string[];
}

export interface Mensaje {
  nivel: string;
  texto: string;
}

export interface Sesion {
  usuario: User | null;
  csrf: string;
  /** URL de static_service (parámetro PLATFORM_STATIC_URL de Django) */
  static: string;
  /** Configuración de suite-shell.js (#suite-shell-config) */
  shell: Record<string, unknown>;
  /** Solo sin sesión: datos de la ventana de acceso (acceso.js) */
  acceso: Acceso | null;
  mensajes: Mensaje[];
}

const aUsuario = (d: UsuarioServidor): User => ({
  id: d.id,
  name: d.name,
  email: d.email,
  role: d.role.toUpperCase() as Role,
  administrador: Boolean(d.administrador),
  picture: d.picture || '',
});

export async function cargarSesion(): Promise<Sesion> {
  const r = await fetch(`${APP_BASENAME}api/sesion/`, { credentials: 'include', headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`/api/sesion/ respondió ${r.status}`);
  const datos = await r.json();
  return { ...datos, usuario: datos.usuario ? aUsuario(datos.usuario) : null, mensajes: datos.mensajes || [] };
}

/** Ruta interna segura (sin dominio ni «//»), para ?acceder=… y el redirect_to de los enlaces viejos. */
export const destinoSeguro = (url: string | null) => (url && /^\/(?!\/)/.test(url) ? url : APP_BASENAME);

/** Sesión vencida o ausente: la portada abre la ventana de acceso de la suite y vuelve a esta página. */
export function irAlLogin() {
  const actual = window.location.pathname + window.location.search;
  window.location.href = `${APP_BASENAME}?acceder=${encodeURIComponent(actual)}`;
}

/** app_url de CEP en la tabla apps de services_auth_db (GET /apps/cep/presentacion); null si no se obtiene. */
export async function urlDeLaApp(): Promise<string | null> {
  try {
    const r = await fetch(`${PLATFORM_AUTH_URL}/apps/${APP_SLUG}/presentacion`, { headers: { Accept: 'application/json' } });
    if (!r.ok) return null;
    const { url } = await r.json();
    return typeof url === 'string' && /^https?:\/\//i.test(url) ? url : null;
  } catch {
    return null;
  }
}
