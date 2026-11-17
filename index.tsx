import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { APP_BASENAME } from './config';
import { cargarSesion, destinoSeguro, Sesion } from './services/session';
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
  if (!sesion.usuario) {
    // Página privada sin sesión: la portada con la ventana de acceso abierta (acceso.js lee ?acceder=…).
    if (pathname !== '/') window.history.replaceState(null, '', `/?acceder=${encodeURIComponent(pathname + search)}`);
    return;
  }
  // Con sesión: ?acceder=… (entró sola con la cookie de otra app de la suite) y el /login?redirect_to=… de los
  // enlaces viejos van directo al destino.
  if (pathname === '/' && params.has('acceder')) {
    window.history.replaceState(null, '', destinoSeguro(params.get('acceder')));
  } else if (pathname.replace(/\/$/, '') === '/login') {
    window.history.replaceState(null, '', destinoSeguro(params.get('redirect_to')));
  }
}

async function arrancar() {
  let sesion: Sesion;
  try {
    sesion = await cargarSesion();
  } catch (e) {
    console.error('CEP:', e);
    root.render(<PaginaError titulo="Sin conexión" texto="No pudimos conectar con CEP. Recarga la página en unos minutos." />);
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
