import React from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ToastType, User } from '../../types';
import Cuentas from './Cuentas';
import Parametros from './Parametros';

export type Aviso = (mensaje: string, tipo?: ToastType['type']) => void;

interface Props {
  user: User;
  avisar: Aviso;
  onError: (e: any) => boolean;
  onCambioCatalogos: () => void;
}

interface Seccion {
  ruta: string;
  titulo: string;
  icono: string;
}

export const SECCIONES: Seccion[] = [
  { ruta: 'cuentas-analiticas', titulo: 'Cuentas analíticas', icono: 'bi-diagram-3' },
  { ruta: 'cuentas-contables', titulo: 'Cuentas contables', icono: 'bi-journal-text' },
  { ruta: 'parametros', titulo: 'Parámetros', icono: 'bi-sliders' },
];

/**
 * Administración de CEP: solo el rol Administrador de la plataforma (el Supervisor revisa solicitudes, pero no
 * administra). Los roles de los usuarios no se administran aquí: son los de la app cep en auth_service.
 */
const Administracion: React.FC<Props> = ({ user, avisar, onError, onCambioCatalogos }) => {
  const { pathname } = useLocation();

  if (!user.administrador) {
    return (
      <div className="suite-card cep-vacio">
        <i className="bi bi-lock" aria-hidden="true"></i>
        <p className="page-sub mt-2 mb-0">No tienes permiso para administrar CEP.</p>
      </div>
    );
  }

  const secciones = SECCIONES;

  return (
    <>
      <div className="cep-encabezado">
        <div className="cep-encabezado-texto">
          <h1 className="page-title">Administración</h1>
          <p className="page-sub mb-0">Catálogos y parámetros de CEP.</p>
        </div>
        <a href="/admin/" className="btn btn-outline-suite d-inline-flex align-items-center gap-2">
          <i className="bi bi-tools" aria-hidden="true"></i>Admin técnico
        </a>
      </div>

      <nav className="cep-filtro" aria-label="Secciones de administración">
        <div className="btn-group cep-adm-secciones" role="group">
          {secciones.map((s) => {
            const activa = pathname.startsWith(`/administracion/${s.ruta}`);
            return (
              <Link key={s.ruta} to={`/administracion/${s.ruta}`} aria-current={activa ? 'page' : undefined}
                    className={`btn btn-outline-suite d-inline-flex align-items-center gap-2${activa ? ' active' : ''}`}>
                <i className={`bi ${s.icono}`} aria-hidden="true"></i>{s.titulo}
              </Link>
            );
          })}
        </div>
      </nav>

      <Routes>
        <Route index element={<Navigate to="cuentas-analiticas" replace />} />
        <Route path="cuentas-analiticas" element={
          <Cuentas tipo="cuentas-analiticas" singular="cuenta analítica" avisar={avisar} onError={onError}
                   onCambio={onCambioCatalogos} />
        } />
        <Route path="cuentas-contables" element={
          <Cuentas tipo="cuentas-contables" singular="cuenta contable" avisar={avisar} onError={onError}
                   onCambio={onCambioCatalogos} />
        } />
        <Route path="parametros" element={<Parametros avisar={avisar} onError={onError} />} />
        <Route path="*" element={<Navigate to="/administracion/cuentas-analiticas" replace />} />
      </Routes>

      <p className="cep-actualizado mt-4 mb-0">
        <i className="bi bi-people" aria-hidden="true"></i>{' '}
        Los roles de los usuarios (Supervisor, Administrador, Compra…) se asignan en la plataforma UAPA Suite.
      </p>
    </>
  );
};

export default Administracion;
