import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { APP_BASENAME, rutaApp } from './config';
import { cargarSesion, destinoSeguro, Sesion, urlDeLaApp } from './services/session';
import { cargarEstilos } from './services/suite';
import SuiteLayout from './components/suite/SuiteLayout';
import Portada from './components/suite/Portada';
import { ErrorBoundary, PaginaError } from './components/suite/ErrorBoundary';
import './styles/cep.css';

/**
 * Toda la interfaz de CEP es React; Django solo responde la API. Al arrancar se pide la sesión, se cargan los
 * estilos de UAPA Suite (static_service) y se dibuja el esqueleto con la pantalla que corresponda.
 */
const root = ReactDOM.createRoot(document.getElementById('root')!);

/** Antes de dibujar, la URL queda en la pantalla que se va a mostrar. */
function ajustarRuta(sesion: Sesion) {
  const { pathname, search } = window.location;
  const params = new URLSearchParams(search);
  const ruta = rutaApp(pathname);
  if (!sesion.usuario) {
    // Página privada sin sesión: la portada con la ventana de acceso abierta (acceso.js lee ?acceder=…).
    if (ruta !== '/') window.history.replaceState(null, '', `${APP_BASENAME}?acceder=${encodeURIComponent(pathname + search)}`);
    return;
  }
  // Con sesión: ?acceder=… (entró sola con la cookie de otra app de la suite) y el /login?redirect_to=… de los
  // enlaces viejos van directo al destino.
  if (ruta === '/' && params.has('acceder')) {
    window.history.replaceState(null, '', destinoSeguro(params.get('acceder')));
  } else if (ruta.replace(/\/$/, '') === '/login') {
    window.history.replaceState(null, '', destinoSeguro(params.get('redirect_to')));
  }
}

async function arrancar() {
  let sesion: Sesion;
  try {
    sesion = await cargarSesion();
  } catch (e) {
    console.error('CEP:', e);
    // Se vuelve a la dirección registrada de CEP (apps.app_url en services_auth_db). Si se entró por otra
    // dirección (IP, otro dominio), se redirige sola; si ya se está en ella, el botón lleva allí (sin bucles).
    const appUrl = await urlDeLaApp();
    if (appUrl && new URL(appUrl, window.location.href).origin !== window.location.origin) {
      window.location.replace(appUrl);
      return;
    }
    root.render(<PaginaError titulo="Sin conexión" texto="No pudimos conectar con CEP. Recarga la página en unos minutos." inicio={appUrl || APP_BASENAME} />);
    return;
  }
  await cargarEstilos(sesion.static);
  ajustarRuta(sesion);
  root.render(
    <React.StrictMode>
      <BrowserRouter basename={APP_BASENAME}>
        <SuiteLayout sesion={sesion}>
          <ErrorBoundary>
            {sesion.usuario ? <App user={sesion.usuario} /> : <Portada stat={sesion.static} />}
          </ErrorBoundary>
        </SuiteLayout>
      </BrowserRouter>
    </React.StrictMode>
  );
}

arrancar();
