import { Injectable, signal } from '@angular/core';

/**
 * Guarda un mensaje entendible cuando falla la conexion con el back (o cualquier
 * error que no sea una respuesta HTTP normal), para que el interceptor lo pueda
 * mostrar sin romper la pantalla que estaba pidiendo el dato.
 */
@Injectable({ providedIn: 'root' })
export class ConnectionErrorService {
  readonly mensaje = signal<string | null>(null);

  mostrar(mensaje: string): void {
    this.mensaje.set(mensaje);
  }

  limpiar(): void {
    this.mensaje.set(null);
  }
}
