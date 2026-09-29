import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export type EstadoPozo = 'Abierto' | 'Comprado' | 'Vendido';

export interface Pozo {
  id: string;
  titulo: string;
  autoDescripcion: string;
  montoObjetivo: number;
  montoRecaudado: number;
  estado: EstadoPozo;
  fechaCreacion: string;
  precioCompra: number | null;
  fechaCompra: string | null;
  precioVenta: number | null;
  fechaVenta: string | null;
  imagenUrl: string | null;
  precioVentaEstimado: number | null;
}

export interface InversionResumen {
  id: string;
  usuarioId: string;
  nombreInversor: string;
  monto: number;
  fecha: string;
}

export interface PozoDetalle extends Pozo {
  inversiones: InversionResumen[];
}

export interface DatosPozo {
  titulo: string;
  autoDescripcion: string;
  montoObjetivo: number;
  imagenUrl: string;
  precioVentaEstimado: number | null;
}

export interface MarcarCompradoDto {
  accion: 'marcarComprado';
  precioCompra: number;
  fechaCompra: string;
}

export interface MarcarVendidoDto {
  accion: 'marcarVendido';
  precioVenta: number;
  fechaVenta: string;
}

export type CambiarEstadoDto = MarcarCompradoDto | MarcarVendidoDto;

export interface RepartoItem {
  usuarioId: string;
  nombreInversor: string;
  montoInvertido: number;
  porcentaje: number;
  ganancia: number;
}

export interface Reparto {
  gananciaTotal: number;
  reparto: RepartoItem[];
}

@Injectable({ providedIn: 'root' })
export class PozosService {
  private readonly http = inject(HttpClient);

  listar() {
    return this.http.get<Pozo[]>(`${environment.apiUrl}/pozos`);
  }

  obtener(id: string) {
    return this.http.get<PozoDetalle>(`${environment.apiUrl}/pozos/${id}`);
  }

  crear(datos: DatosPozo) {
    return this.http.post<Pozo>(`${environment.apiUrl}/pozos`, datos);
  }

  actualizar(id: string, datos: DatosPozo) {
    return this.http.put<Pozo>(`${environment.apiUrl}/pozos/${id}`, datos);
  }

  eliminar(id: string) {
    return this.http.delete<void>(`${environment.apiUrl}/pozos/${id}`);
  }

  cambiarEstado(id: string, datos: CambiarEstadoDto) {
    return this.http.put<Pozo>(`${environment.apiUrl}/pozos/${id}/estado`, datos);
  }

  reparto(id: string) {
    return this.http.get<Reparto>(`${environment.apiUrl}/pozos/${id}/reparto`);
  }
}
