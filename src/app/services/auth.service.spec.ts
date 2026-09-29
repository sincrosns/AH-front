import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../environments/environment';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { AuthService, TOKEN_KEY } from './auth.service';
import { ThemeService } from './theme.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let themeSvc: ThemeService;

  const usuarioMock = {
    id: '1',
    nombre: 'Ana',
    apellido: 'Gomez',
    email: 'ana@test.com',
    telefono: '',
    tema: 'oscuro' as const,
    fechaAlta: new Date().toISOString(),
    ultimoAcceso: new Date().toISOString(),
    notificacionesEmail: true,
  };

  beforeEach(() => {
    localStorage.removeItem(TOKEN_KEY);

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    themeSvc = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem(TOKEN_KEY);
  });

  it('arranca sin verificar sesion cuando no hay token guardado', () => {
    expect(service.verificandoSesion()).toBeFalse();
  });

  it('guarda el token y el usuario al loguearse correctamente', () => {
    service.login('ana@test.com', 'unaPassword1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'un-token', usuario: usuarioMock });

    expect(localStorage.getItem(TOKEN_KEY)).toBe('un-token');
    expect(service.usuarioActual()).toEqual(usuarioMock);
  });

  it('sincroniza el tema del usuario con ThemeService al loguearse', () => {
    const setSpy = spyOn(themeSvc, 'set');

    service.login('ana@test.com', 'unaPassword1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ token: 'un-token', usuario: usuarioMock });

    expect(setSpy).toHaveBeenCalledWith('oscuro');
  });
});

describe('AuthService al recargar la app con sesion activa', () => {
  let httpMock: HttpTestingController;
  let themeSvc: ThemeService;

  beforeEach(() => {
    localStorage.setItem(TOKEN_KEY, 'un-token-existente');

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    themeSvc = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem(TOKEN_KEY);
  });

  it('sincroniza el tema del usuario con ThemeService al cargar el usuario actual desde el token guardado', fakeAsync(() => {
    const setSpy = spyOn(themeSvc, 'set');

    // El constructor de AuthService dispara cargarUsuarioActual() porque ya hay token en
    // localStorage, pero diferido a un microtask (ver comentario en auth.service.ts): hace
    // falta un tick() para que la peticion ya este en vuelo antes de expectOne.
    TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    tick();

    const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/me`);
    expect(req.request.method).toBe('GET');
    req.flush({
      id: '1',
      nombre: 'Ana',
      apellido: 'Gomez',
      email: 'ana@test.com',
      telefono: '',
      tema: 'oscuro',
      fechaAlta: new Date().toISOString(),
      ultimoAcceso: new Date().toISOString(),
      notificacionesEmail: true,
    });

    expect(setSpy).toHaveBeenCalledWith('oscuro');
  }));

  it('arranca verificando la sesion cuando hay token, y deja de verificar cuando /usuarios/me resuelve', fakeAsync(() => {
    const service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    expect(service.verificandoSesion()).toBeTrue();
    tick();

    const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/me`);
    req.flush({
      id: '1',
      nombre: 'Ana',
      apellido: 'Gomez',
      email: 'ana@test.com',
      telefono: '',
      tema: 'oscuro',
      fechaAlta: new Date().toISOString(),
      ultimoAcceso: new Date().toISOString(),
      notificacionesEmail: true,
    });

    expect(service.verificandoSesion()).toBeFalse();
  }));

  it('deja de verificar la sesion cuando /usuarios/me falla por token invalido o vencido', fakeAsync(() => {
    const service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    expect(service.verificandoSesion()).toBeTrue();
    tick();

    const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/me`);
    req.flush('no autorizado', { status: 401, statusText: 'Unauthorized' });

    expect(service.verificandoSesion()).toBeFalse();
  }));
});

// Tarea 787: con el interceptor real puesto (authInterceptor hace inject(AuthService)
// para leer el token), construir AuthService mientras hay un token guardado disparaba
// NG0200 (Circular dependency detected for AuthService): el HTTP GET a /usuarios/me se
// llamaba en el mismo constructor, antes de que Angular terminara de registrar el
// servicio, y el interceptor volvia a pedir esa misma instancia. Este describe usa el
// stack real (con el interceptor) en vez de provideHttpClient() a secas, que es lo
// unico que reproduce el bug.
describe('AuthService al recargar con el interceptor real puesto', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem(TOKEN_KEY, 'un-token-existente');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem(TOKEN_KEY);
  });

  it('no tira NG0200 y termina cargando el usuario desde /usuarios/me', fakeAsync(() => {
    let service!: AuthService;
    expect(() => (service = TestBed.inject(AuthService))).not.toThrow();
    httpMock = TestBed.inject(HttpTestingController);

    tick();

    const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/me`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer un-token-existente');
    req.flush({
      id: '1',
      nombre: 'Ana',
      apellido: 'Gomez',
      email: 'ana@test.com',
      telefono: '',
      tema: 'claro',
      fechaAlta: new Date().toISOString(),
      ultimoAcceso: null,
      notificacionesEmail: true,
    });

    expect(service.verificandoSesion()).toBeFalse();
    expect(service.estaLogueado()).toBeTrue();
  }));
});
