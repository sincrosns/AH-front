import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Protege la landing publica (/) de quien ya tiene sesion.
 * Espera a que termine la restauracion asincrona de la sesion (verificandoSesion en AuthService)
 * antes de decidir: sin eso, una carga fresca con token guardado muestra la landing publica
 * completa un instante porque estaLogueado() todavia da false mientras se resuelve GET /usuarios/me,
 * y nunca se reevalua despues. Con la sesion ya resuelta: si hay usuario logueado redirige a /cuenta,
 * si no, deja pasar a la landing publica.
 */
export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return toObservable(auth.verificandoSesion).pipe(
    filter((verificando) => !verificando),
    take(1),
    map(() => (auth.estaLogueado() ? router.parseUrl('/cuenta') : true)),
  );
};
