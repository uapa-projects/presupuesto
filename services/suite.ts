/**
 * Recursos de UAPA Suite (static_service): estilos, Bootstrap y los scripts del esqueleto y del acceso.
 * La URL sale de la sesión (parámetro PLATFORM_STATIC_URL de Django), así que se cargan desde aquí.
 */
const cargados = new Map<string, Promise<void>>();

function cargarCss(href: string, antesDe: Node | null): Promise<void> {
  // Ya viene en index.html (URL por defecto): el navegador lo cargó antes de pintar, no hay que esperarlo.
  if (document.head.querySelector(`link[rel="stylesheet"][href="${href}"]`)) return Promise.resolve();
  if (!cargados.has(href)) {
    cargados.set(href, new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      // Si un estilo no carga, la app se muestra igual (sin él) en vez de quedarse en blanco.
      link.onload = link.onerror = () => resolve();
      document.head.insertBefore(link, antesDe);
    }));
  }
  return cargados.get(href)!;
}

/** Script clásico, una sola vez (StrictMode monta los efectos dos veces en desarrollo). */
export function cargarScript(src: string, datos: Record<string, string> = {}): Promise<void> {
  if (!cargados.has(src)) {
    cargados.set(src, new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      Object.entries(datos).forEach(([k, v]) => { s.dataset[k] = v; });
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      document.body.appendChild(s);
    }));
  }
  return cargados.get(src)!;
}

/** Antes de dibujar: favicon, fuentes, Bootstrap, iconos y suite.css. */
export async function cargarEstilos(stat: string) {
  const icono = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (icono) icono.href = `${stat}/img/cep.ico`;
  // Antes del CSS propio de CEP (el del build o el que inyecta Vite), que usa las variables de suite.css.
  const primero = document.head.querySelector('link[rel="stylesheet"][href*="/assets/"], style');
  await Promise.all(['css/fonts.css', 'vendor/bootstrap/5.3.3/bootstrap.min.css',
    'vendor/bootstrap-icons/1.11.3/bootstrap-icons.min.css', 'css/suite.css']
    .map((h) => cargarCss(`${stat}/${h}`, primero)));
}

/**
 * Después de dibujar los contenedores: Bootstrap, el esqueleto (suite-shell.js pinta barra lateral, barra
 * superior y pie con #suite-shell-config y data-ruta) y, sin sesión, la ventana de acceso (acceso.js) y el
 * botón de Google.
 */
export async function iniciarSuite(stat: string, ruta: string, acceso: { google: boolean } | null) {
  await cargarScript(`${stat}/vendor/bootstrap/5.3.3/bootstrap.bundle.min.js`);
  await cargarScript(`${stat}/js/suite-shell.js`, { ruta });
  await cargarScript(`${stat}/js/suite.js`);
  if (!acceso) return;
  await cargarScript(`${stat}/js/acceso.js`);
  if (!acceso.google || googleIniciado) return;
  googleIniciado = true;
  // acceso.js define window.suiteGoogleListo; se llama cuando el script de Google termina de cargar.
  await cargarScript('https://accounts.google.com/gsi/client');
  (window as unknown as { suiteGoogleListo?: () => void }).suiteGoogleListo?.();
}

let googleIniciado = false;
