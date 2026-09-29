import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { invitadoGuard } from './invitado.guard';
import { AuthService } from '../services/auth.service';

describe('invitadoGuard', () => {
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
      invitadoGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as Observable<boolean | UrlTree>;
  }

  it('deja pasar cuando no hay usuario logueado', (done) => {
    authServiceMock.estaLogueado.and.returnValue(false);

    correrGuard().subscribe((resultado) => {
      expect(resultado).toBe(true);
      done();
    });
  });

  it('redirige a /cuenta cuando ya hay sesion', (done) => {
    authServiceMock.estaLogueado.and.returnValue(true);

    correrGuard().subscribe((resultado) => {
      expect(resultado).toEqual(router.parseUrl('/cuenta'));
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

    expect(resultado).toEqual(router.parseUrl('/cuenta'));
  });
});
