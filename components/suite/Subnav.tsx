import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Role, User } from '../../types';

/** Menú propio de CEP (.suite-subnav): estilo de suite.css; los enlaces navegan dentro de React sin recargar. */
const CREAN_SOLICITUDES = [Role.COLABORADOR, Role.COMPRA_RSS, Role.COMPRA_RSD, Role.COMPRA_RCO];

const Opcion: React.FC<{ to: string; activa: boolean; icono: string; children: React.ReactNode }> = ({ to, activa, icono, children }) => (
  <li className="nav-item">
    <Link className={`nav-link${activa ? ' active' : ''}`} aria-current={activa ? 'page' : undefined} to={to}>
      <i className={`bi ${icono}`} aria-hidden="true"></i>{children}
    </Link>
  </li>
);

const Subnav: React.FC<{ usuario: User }> = ({ usuario }) => {
  const { pathname } = useLocation();
  return (
    <nav className="suite-subnav" aria-label="Menú de CEP">
      <ul className="nav nav-underline flex-nowrap">
        <Opcion to="/" icono="bi-file-earmark-text" activa={pathname === '/' || pathname.startsWith('/request/')}>
          Solicitudes
        </Opcion>
        {CREAN_SOLICITUDES.includes(usuario.role) && (
          <Opcion to="/create" icono="bi-plus-circle" activa={pathname === '/create'}>Nueva solicitud</Opcion>
        )}
        {usuario.administrador && (
          <Opcion to="/administracion" icono="bi-gear" activa={pathname.startsWith('/administracion')}>Administrar</Opcion>
        )}
      </ul>
    </nav>
  );
};

export default Subnav;
