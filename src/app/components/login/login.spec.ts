import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ThemeService } from '../../services/theme.service';
import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let httpMock: HttpTestingController;
  let router: Router;
  let themeSvc: ThemeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    themeSvc = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('deberia crearse', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('no envia el formulario si es invalido', () => {
    const component = fixture.componentInstance;
    component.onSubmit();

    expect(component.form.invalid).toBeTrue();
    httpMock.expectNone(`${environment.apiUrl}/auth/login`);
  });

  it('navega a home cuando el login es correcto', () => {
    const navigateSpy = spyOn(router, 'navigateByUrl');
    const component = fixture.componentInstance;

    component.form.setValue({ email: 'a@test.com', password: 'unaPassword1' });
    component.onSubmit();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({
      token: 'un-token',
      usuario: {
        id: '1',
        nombre: 'Ana',
        apellido: 'Gomez',
        email: 'a@test.com',
        telefono: '',
        tema: 'claro',
        fechaAlta: new Date().toISOString(),
        ultimoAcceso: new Date().toISOString(),
        notificacionesEmail: true,
      },
    });

    expect(navigateSpy).toHaveBeenCalledWith('/cuenta');
  });

  it('sincroniza el tema del usuario al loguearse', () => {
    const setSpy = spyOn(themeSvc, 'set');
    const component = fixture.componentInstance;

    component.form.setValue({ email: 'a@test.com', password: 'unaPassword1' });
    component.onSubmit();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({
      token: 'un-token',
      usuario: {
        id: '1',
        nombre: 'Ana',
        apellido: 'Gomez',
        email: 'a@test.com',
        telefono: '',
        tema: 'oscuro',
        fechaAlta: new Date().toISOString(),
        ultimoAcceso: new Date().toISOString(),
        notificacionesEmail: true,
      },
    });

    expect(setSpy).toHaveBeenCalledWith('oscuro');
  });

  it('muestra el aviso de cuenta creada cuando llega desde el registro', () => {
    spyOn(router, 'getCurrentNavigation').and.returnValue({
      extras: { state: { cuentaCreada: true } },
    } as unknown as ReturnType<Router['getCurrentNavigation']>);

    const testFixture = TestBed.createComponent(Login);

    expect(testFixture.componentInstance.cuentaCreada()).toBeTrue();
  });

  it('renderiza el formulario en el layout full-bleed y dispara el submit al hacer click', () => {
    fixture.detectChanges();

    const form = (fixture.nativeElement as HTMLElement).querySelector('form.login__form');
    expect(form).toBeTruthy();

    const component = fixture.componentInstance;
    component.form.setValue({ email: 'a@test.com', password: 'unaPassword1' });
    fixture.detectChanges();

    const submitBtn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.login__submit');
    expect(submitBtn).toBeTruthy();
    submitBtn!.click();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({
      token: 'un-token',
      usuario: {
        id: '1',
        nombre: 'Ana',
        apellido: 'Gomez',
        email: 'a@test.com',
        telefono: '',
        tema: 'claro',
        fechaAlta: new Date().toISOString(),
        ultimoAcceso: new Date().toISOString(),
        notificacionesEmail: true,
      },
    });
  });

  it('muestra el error cuando el login falla', () => {
    const component = fixture.componentInstance;
    component.form.setValue({ email: 'a@test.com', password: 'mala' });
    component.onSubmit();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ error: 'Email o contraseña incorrectos' }, { status: 401, statusText: 'Unauthorized' });

    expect(component.error()).toBe('Email o contraseña incorrectos');
    expect(component.enviando()).toBeFalse();
  });
});
