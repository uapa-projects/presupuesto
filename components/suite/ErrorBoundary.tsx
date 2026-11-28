import React from 'react';
import { APP_BASENAME } from '../../config';

/** Página de error de la interfaz (antes era la 500.html de Django): si una pantalla falla, no queda en blanco. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: boolean }> {
  state = { error: false };

  static getDerivedStateFromError() {
    return { error: true };
  }

  componentDidCatch(error: unknown) {
    console.error('CEP:', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <PaginaError titulo="Algo salió mal" texto="No pudimos mostrar esta pantalla. Recarga la página o vuelve a intentarlo más tarde." />;
  }
}

/** `inicio`: a dónde lleva «Volver al inicio» (el app_url de CEP en la plataforma; por defecto, el inicio de CEP). */
export const PaginaError: React.FC<{ titulo: string; texto: string; inicio?: string }> = ({ titulo, texto, inicio = APP_BASENAME }) => (
  <div className="row justify-content-center my-4">
    <div className="col-12 col-md-8 col-lg-6">
      <div className="suite-card panel text-center">
        <i className="bi bi-exclamation-triangle cep-error-icono" aria-hidden="true"></i>
        <h1 className="page-title">{titulo}</h1>
        <p className="page-sub">{texto}</p>
        <a href={inicio} className="btn btn-primary mt-2 mb-3">Volver al inicio</a>
      </div>
    </div>
  </div>
);
