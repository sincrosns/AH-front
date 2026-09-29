import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authServiceMock: { estaLogueado: jasmine.Spy; verificandoSesion: WritableSignal<boolean> };
  let router: Router;

  beforeEach(() => {
    authServiceMock = {
      estaLogueado: jasmine.createSpy('estaLogueado'),
      verificandoSesion: signal(false),
    };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceMock }],
    });

    router = TestBed.inject(Router);
  });

  function correrGuard(): Observable<boolean | UrlTree> {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as Observable<boolean | UrlTree>;
  }

  it('deja pasar cuando hay usuario logueado', (done) => {
    authServiceMock.estaLogueado.and.returnValue(true);

    correrGuard().subscribe((resultado) => {
      expect(resultado).toBe(true);
      done();
    });
  });

  it('redirige a /login cuando no hay sesion', (done) => {
    authServiceMock.estaLogueado.and.returnValue(false);

    correrGuard().subscribe((resultado) => {
      expect(resultado).toEqual(router.parseUrl('/login'));
      done();
    });
  });

  it('no decide nada mientras se esta verificando la sesion, y decide apenas termina', () => {
    authServiceMock.verificandoSesion.set(true);
    authServiceMock.estaLogueado.and.returnValue(true);

    let resultado: boolean | UrlTree | undefined;
    correrGuard().subscribe((r) => (resultado = r));

    expect(resultado).toBeUndefined();

    authServiceMock.verificandoSesion.set(false);
    TestBed.tick();

    expect(resultado).toBe(true);
  });
});
