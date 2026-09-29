import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { EstadoPozo, InversionResumen } from './pozos.service';

export interface Inversion {
  id: string;
  pozoId: string;
  usuarioId: string;
  monto: number;
  fecha: string;
}

export interface DatosInversion {
  monto: number;
}

export interface MiInversion {
  id: string;
  pozoId: string;
  tituloPozo: string;
  autoDescripcion: string;
  estadoPozo: EstadoPozo;
  imagenUrl: string | null;
  monto: number;
  fecha: string;
  gananciaCorrespondiente: number | null;
}

@Injectable({ providedIn: 'root' })
export class InversionesService {
  private readonly http = inject(HttpClient);

  crear(pozoId: string, datos: DatosInversion) {
    return this.http.post<Inversion>(`${environment.apiUrl}/pozos/${pozoId}/inversiones`, datos);
  }

  listar(pozoId: string) {
    return this.http.get<InversionResumen[]>(`${environment.apiUrl}/pozos/${pozoId}/inversiones`);
  }

  actualizar(id: string, datos: DatosInversion) {
    return this.http.put<Inversion>(`${environment.apiUrl}/inversiones/${id}`, datos);
  }

  eliminar(id: string) {
    return this.http.delete<void>(`${environment.apiUrl}/inversiones/${id}`);
  }

  misInversiones() {
    return this.http.get<MiInversion[]>(`${environment.apiUrl}/usuarios/me/inversiones`);
  }
}
