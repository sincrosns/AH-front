import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Tema, Usuario } from './auth.service';

export interface DatosActualizarPerfil {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
}

export interface DatosCambiarPassword {
  passwordActual: string;
  passwordNueva: string;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);

  obtenerMe() {
    return this.http.get<Usuario>(`${environment.apiUrl}/usuarios/me`);
  }

  actualizarMe(datos: DatosActualizarPerfil) {
    return this.http.put<Usuario>(`${environment.apiUrl}/usuarios/me`, datos);
  }

  cambiarPassword(datos: DatosCambiarPassword) {
    return this.http.put<{ mensaje: string }>(`${environment.apiUrl}/usuarios/me/password`, datos);
  }

  cambiarTema(tema: Tema) {
    return this.http.put<{ tema: Tema }>(`${environment.apiUrl}/usuarios/me/tema`, { tema });
  }

  eliminarMe() {
    return this.http.delete<void>(`${environment.apiUrl}/usuarios/me`);
  }

  cambiarNotificaciones(valor: boolean) {
    return this.http.put<{ notificacionesEmail: boolean }>(
      `${environment.apiUrl}/usuarios/me/notificaciones`,
      { notificacionesEmail: valor },
    );
  }
}
