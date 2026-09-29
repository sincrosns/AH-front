import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Registro } from './registro';

describe('Registro', () => {
  let fixture: ComponentFixture<Registro>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Registro],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Registro);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
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
    httpMock.expectNone(`${environment.apiUrl}/auth/register`);
  });

  it('navega a login cuando el registro es correcto', () => {
    const navigateSpy = spyOn(router, 'navigateByUrl');
    const component = fixture.componentInstance;

    component.form.setValue({
      nombre: 'Ana',
      apellido: 'Gomez',
      email: 'ana@test.com',
      telefono: '1122334455',
      password: 'unaPassword1',
    });
    component.onSubmit();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    req.flush({ mensaje: 'Usuario registrado correctamente' });

    expect(navigateSpy).toHaveBeenCalledWith('/login', { state: { cuentaCreada: true } });
  });

  it('muestra el error cuando el email ya esta registrado', () => {
    const component = fixture.componentInstance;
    component.form.setValue({
      nombre: 'Ana',
      apellido: 'Gomez',
      email: 'ana@test.com',
      telefono: '1122334455',
      password: 'unaPassword1',
    });
    component.onSubmit();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
    req.flush({ error: 'El email ya está registrado' }, { status: 409, statusText: 'Conflict' });

    expect(component.error()).toBe('El email ya está registrado');
    expect(component.enviando()).toBeFalse();
  });
});
