import { HttpClient } from './http-client';

/** Cuenta analítica o contable en la pantalla Administración. `en_uso`: tiene solicitudes (no se puede eliminar). */
export interface CuentaAdmin {
  id: number;
  codigo: string;
  nombre: string;
  en_uso: boolean;
}

export interface Parametro {
  nombre: string;
  valor: string;
  descripcion: string;
}

export type TipoCuenta = 'cuentas-analiticas' | 'cuentas-contables';

/** API de Administración (Backend/presupuesto/administracion.py). Las contraseñas nunca vienen por aquí. */
class AdminService extends HttpClient {
  cuentas(tipo: TipoCuenta) {
    return this.get<CuentaAdmin[]>(`/administracion/${tipo}/`);
  }

  crearCuenta(tipo: TipoCuenta, datos: { codigo: string; nombre: string }) {
    return this.post<CuentaAdmin>(`/administracion/${tipo}/`, datos);
  }

  editarCuenta(tipo: TipoCuenta, id: number, datos: { codigo: string; nombre: string }) {
    return this.put<CuentaAdmin>(`/administracion/${tipo}/${id}/`, datos);
  }

  eliminarCuenta(tipo: TipoCuenta, id: number) {
    return this.del<void>(`/administracion/${tipo}/${id}/`);
  }

  parametros() {
    return this.get<Parametro[]>('/administracion/parametros/');
  }

  editarParametro(nombre: string, valor: string) {
    return this.put<Parametro>(`/administracion/parametros/${encodeURIComponent(nombre)}/`, { valor });
  }
}

export const adminService = new AdminService();

/** Mensaje de error de la API ({error}) o uno por defecto. */
export const mensajeDe = (e: any, defecto: string): string => e?.data?.error || defecto;
