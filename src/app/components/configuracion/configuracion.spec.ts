import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ThemeService } from '../../services/theme.service';
import { Configuracion } from './configuracion';

describe('Configuracion', () => {
  let fixture: ComponentFixture<Configuracion>;
  let httpMock: HttpTestingController;
  let themeSvc: ThemeService;

  const meUrl = `${environment.apiUrl}/usuarios/me`;

  const usuarioMock = {
    id: '1',
    nombre: 'Ana',
    apellido: 'Gomez',
    email: 'ana@test.com',
    telefono: '1122334455',
    tema: 'claro' as const,
    fechaAlta: new Date().toISOString(),
    ultimoAcceso: new Date().toISOString(),
    notificacionesEmail: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Configuracion],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Configuracion);
    httpMock = TestBed.inject(HttpTestingController);
    themeSvc = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deberia crearse y cargar el usuario actual', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);

    expect(fixture.componentInstance.usuario()).toEqual(usuarioMock);
    expect(fixture.componentInstance.perfilForm.value.nombre).toBe('Ana');
  });

  it('muestra un error y deja de cargar si falla obtenerMe', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.meCargando()).toBeTrue();

    const req = httpMock.expectOne(meUrl);
    req.flush({ error: 'No se pudo cargar' }, { status: 500, statusText: 'Server Error' });

    expect(fixture.componentInstance.meCargando()).toBeFalse();
    expect(fixture.componentInstance.meError()).toBe('No se pudo cargar');
    expect(fixture.componentInstance.usuario()).toBeNull();
  });

  it('guarda el perfil actualizado', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);

    const component = fixture.componentInstance;
    component.perfilForm.setValue({
      nombre: 'Ana',
      apellido: 'Gomez',
      telefono: '5599887766',
      email: 'ana@test.com',
    });
    component.guardarPerfil();

    const req = httpMock.expectOne(meUrl);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...usuarioMock, telefono: '5599887766' });

    expect(component.perfilExito()).toBeTrue();
  });

  it('muestra un error si falla el guardado del perfil', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);

    const component = fixture.componentInstance;
    component.perfilForm.setValue({
      nombre: 'Ana',
      apellido: 'Gomez',
      telefono: '5599887766',
      email: 'ana@test.com',
    });
    component.guardarPerfil();

    const req = httpMock.expectOne(meUrl);
    req.flush({ error: 'No se pudo actualizar' }, { status: 400, statusText: 'Bad Request' });

    expect(component.perfilError()).toBe('No se pudo actualizar');
    expect(component.perfilEnviando()).toBeFalse();
  });

  it('cambia la contrasena', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);

    const component = fixture.componentInstance;
    component.passwordForm.setValue({ passwordActual: 'vieja1234', passwordNueva: 'nueva1234' });
    component.cambiarPassword();

    const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/me/password`);
    expect(req.request.method).toBe('PUT');
    req.flush({ mensaje: 'Contraseña actualizada' });

    expect(component.passwordExito()).toBeTrue();
  });

  it('muestra un error si falla el cambio de contrasena', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);

    const component = fixture.componentInstance;
    component.passwordForm.setValue({ passwordActual: 'vieja1234', passwordNueva: 'nueva1234' });
    component.cambiarPassword();

    const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/me/password`);
    req.flush({ error: 'La contraseña actual es incorrecta' }, { status: 400, statusText: 'Bad Request' });

    expect(component.passwordError()).toBe('La contraseña actual es incorrecta');
    expect(component.passwordEnviando()).toBeFalse();
  });

  it('cambia el tema', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);

    const component = fixture.componentInstance;
    component.cambiarTema('oscuro');

    const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/me/tema`);
    expect(req.request.method).toBe('PUT');
    req.flush({ tema: 'oscuro' });

    expect(component.usuario()?.tema).toBe('oscuro');
  });

  it('aplica el tema nuevo con ThemeService al cambiarlo', () => {
    const setSpy = spyOn(themeSvc, 'set');
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);

    const component = fixture.componentInstance;
    component.cambiarTema('oscuro');

    const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/me/tema`);
    req.flush({ tema: 'oscuro' });

    expect(setSpy).toHaveBeenCalledWith('oscuro');
  });

  it('muestra un error si falla el cambio de tema', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);

    const component = fixture.componentInstance;
    component.cambiarTema('oscuro');

    const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/me/tema`);
    req.flush({ error: 'No se pudo cambiar' }, { status: 400, statusText: 'Bad Request' });

    expect(component.temaError()).toBe('No se pudo cambiar');
    expect(component.temaEnviando()).toBeFalse();
    expect(component.usuario()?.tema).toBe('claro');
  });

  it('muestra la confirmacion al cambiar el tema con exito', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);

    const component = fixture.componentInstance;
    component.cambiarTema('oscuro');

    const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/me/tema`);
    req.flush({ tema: 'oscuro' });

    expect(component.temaExito()).toBeTrue();
  });

  it('cambia la preferencia de notificaciones por email', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);

    const component = fixture.componentInstance;
    const checkbox = { checked: false } as unknown as HTMLInputElement;
    const evento = { target: checkbox } as unknown as Event;
    component.cambiarNotificaciones(evento);

    const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/me/notificaciones`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ notificacionesEmail: false });
    req.flush({ notificacionesEmail: false });

    expect(component.usuario()?.notificacionesEmail).toBeFalse();
    expect(component.notifExito()).toBeTrue();
  });

  it('revierte el checkbox y muestra un error si falla el cambio de notificaciones', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);

    const component = fixture.componentInstance;
    const checkbox = { checked: false } as unknown as HTMLInputElement;
    const evento = { target: checkbox } as unknown as Event;
    component.cambiarNotificaciones(evento);

    const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/me/notificaciones`);
    req.flush({ error: 'No se pudo actualizar' }, { status: 400, statusText: 'Bad Request' });

    expect(component.notifError()).toBe('No se pudo actualizar');
    expect(component.notifEnviando()).toBeFalse();
    expect(checkbox.checked).toBeTrue();
  });

  it('abre el modal de confirmacion al pedir eliminar la cuenta', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);

    const component = fixture.componentInstance;
    component.eliminarCuenta();

    expect(component.confirmEliminarVisible()).toBeTrue();
    httpMock.expectNone(meUrl);
  });

  it('elimina la cuenta y cierra sesion si el usuario confirma en el modal', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');

    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);

    localStorage.setItem('ah_token', 'un-token');
    const component = fixture.componentInstance;
    component.eliminarCuenta();
    component.confirmarEliminarCuenta();

    expect(component.confirmEliminarVisible()).toBeFalse();

    const req = httpMock.expectOne(meUrl);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(localStorage.getItem('ah_token')).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('no elimina la cuenta si el usuario cancela en el modal', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);

    const component = fixture.componentInstance;
    component.eliminarCuenta();
    component.cancelarEliminarCuenta();

    expect(component.confirmEliminarVisible()).toBeFalse();
    expect(component.eliminarEnviando()).toBeFalse();
    httpMock.expectNone(meUrl);
  });

  it('muestra un error si falla la eliminacion de la cuenta', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);

    const component = fixture.componentInstance;
    component.eliminarCuenta();
    component.confirmarEliminarCuenta();

    const req = httpMock.expectOne(meUrl);
    req.flush({ error: 'No se pudo eliminar' }, { status: 400, statusText: 'Bad Request' });

    expect(component.eliminarError()).toBe('No se pudo eliminar');
  });
});
