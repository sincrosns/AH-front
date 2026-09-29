import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { ConnectionErrorService } from '../services/connection-error.service';

/**
 * Agrega el JWT a cada request contra nuestra propia API y traduce los
 * errores de conexion (back caido, sin red) en un mensaje entendible en vez
 * de dejar que la pantalla que pidio el dato se rompa con una excepcion cruda.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const connectionError = inject(ConnectionErrorService);

  const esApiPropia = req.url.startsWith(environment.apiUrl);
  const token = auth.getToken();

  if (esApiPropia && token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    tap(() => connectionError.limpiar()),
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && esApiPropia) {
        if (err.status === 0) {
          connectionError.mostrar('No se pudo conectar con el servidor. Revisa tu conexion e intenta de nuevo.');
        } else if (err.status === 401) {
          auth.sesionExpirada();
        }
      }
      return throwError(() => err);
    }),
  );
};
