/** Prefijo de CEP: en producción vive en https://gtsst.uapa.edu.do/suitecep/; con Vite (npm run dev), en la raíz. */
export const APP_BASENAME = import.meta.env.DEV ? '/' : '/suitecep/';

/** Ruta dentro de CEP (sin el prefijo), como la ve React Router: «/suitecep/create» → «/create». */
export const rutaApp = (pathname: string) =>
  pathname.startsWith(APP_BASENAME) ? `/${pathname.slice(APP_BASENAME.length)}` : pathname;

/** Slug de CEP en la tabla apps de services_auth_db. */
export const APP_SLUG = 'cep';

/**
 * auth_service (serviceserver). Solo se usa cuando Django no responde y no hay /api/sesion/ que lo diga:
 * GET /apps/cep/presentacion es público y trae la `url` (apps.app_url). En desarrollo va por el proxy de Vite.
 */
export const PLATFORM_AUTH_URL = import.meta.env.DEV
  ? '/plataforma-auth'
  : 'https://gtsst.uapa.edu.do/serviceserver/auth';
