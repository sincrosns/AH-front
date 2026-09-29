import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { ConnectionErrorService } from '../services/connection-error.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceMock: { getToken: jasmine.Spy; sesionExpirada: jasmine.Spy };
  let connectionErrorMock: { mostrar: jasmine.Spy; limpiar: jasmine.Spy };

  beforeEach(() => {
    authServiceMock = {
      getToken: jasmine.createSpy('getToken').and.returnValue(null),
      sesionExpirada: jasmine.createSpy('sesionExpirada'),
    };
    connectionErrorMock = {
      mostrar: jasmine.createSpy('mostrar'),
      limpiar: jasmine.createSpy('limpiar'),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: ConnectionErrorService, useValue: connectionErrorMock },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('agrega el header Authorization cuando hay token', () => {
    authServiceMock.getToken.and.returnValue('un-token');

    http.get(`${environment.apiUrl}/usuarios/me`).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/me`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer un-token');
    req.flush({});
  });

  it('llama a ConnectionErrorService.mostrar() ante un error de conexion (status 0)', () => {
    http.get(`${environment.apiUrl}/usuarios/me`).subscribe({ error: () => {} });

    const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/me`);
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(connectionErrorMock.mostrar).toHaveBeenCalledWith(
      'No se pudo conectar con el servidor. Revisa tu conexion e intenta de nuevo.',
    );
  });

  it('llama a AuthService.sesionExpirada() ante un 401 con token presente', () => {
    authServiceMock.getToken.and.returnValue('un-token');

    http.get(`${environment.apiUrl}/usuarios/me`).subscribe({ error: () => {} });

    const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/me`);
    req.flush({ mensaje: 'Token expirado' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceMock.sesionExpirada).toHaveBeenCalled();
  });
});
