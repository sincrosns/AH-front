import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Protege rutas que requieren sesion.
 * Espera a que termine la restauracion asincrona de la sesion (verificandoSesion en AuthService)
 * antes de decidir: sin eso, un refresh con token valido redirige a /login porque la llamada
 * a /usuarios/me todavia no resolvio. Sin usuario logueado al terminar de verificar, redirige a /login.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return toObservable(auth.verificandoSesion).pipe(
    filter((verificando) => !verificando),
    take(1),
    map(() => (auth.estaLogueado() ? true : router.parseUrl('/login'))),
  );
};
