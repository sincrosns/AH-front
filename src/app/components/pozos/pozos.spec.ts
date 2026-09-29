import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { routes } from '../../app.routes';
import { Pozo } from '../../services/pozos.service';
import { Pozos } from './pozos';

describe('Pozos', () => {
  let fixture: ComponentFixture<Pozos>;
  let httpMock: HttpTestingController;

  const pozosUrl = `${environment.apiUrl}/pozos`;

  const pozoMock: Pozo = {
    id: '1',
    titulo: 'Fiat Cronos 2022',
    autoDescripcion: 'Fiat Cronos 2022, 30.000km',
    montoObjetivo: 10000,
    montoRecaudado: 4000,
    estado: 'Abierto',
    fechaCreacion: new Date().toISOString(),
    precioCompra: null,
    fechaCompra: null,
    precioVenta: null,
    fechaVenta: null,
    imagenUrl: null,
    precioVentaEstimado: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pozos],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Pozos);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deberia crearse', () => {
    fixture.detectChanges();
    httpMock.expectOne(pozosUrl).flush([pozoMock]);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra un estado de carga mientras espera la respuesta', () => {
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Cargando');

    httpMock.expectOne(pozosUrl).flush([pozoMock]);
  });

  it('muestra el listado de pozos', () => {
    fixture.detectChanges();
    httpMock.expectOne(pozosUrl).flush([pozoMock]);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Fiat Cronos 2022');
    expect(texto).toContain('Abierto');
  });

  it('muestra un estado vacio si no hay pozos', () => {
    fixture.detectChanges();
    httpMock.expectOne(pozosUrl).flush([]);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Todavia no hay pozos');
  });

  it('muestra un estado de error si falla el pedido', () => {
    fixture.detectChanges();
    httpMock.expectOne(pozosUrl).flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.componentInstance.error()).toBeTruthy();
    expect(fixture.componentInstance.cargando()).toBeFalse();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Reintentar');
  });

  it('reintenta el pedido al hacer click en Reintentar', () => {
    fixture.detectChanges();
    httpMock.expectOne(pozosUrl).flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    fixture.componentInstance.reintentar();
    fixture.detectChanges();
    expect(fixture.componentInstance.cargando()).toBeTrue();

    httpMock.expectOne(pozosUrl).flush([pozoMock]);
    fixture.detectChanges();

    expect(fixture.componentInstance.pozos()).toEqual([pozoMock]);
    expect(fixture.componentInstance.error()).toBeNull();
  });

  describe('guardarPozo', () => {
    it('crea un pozo nuevo y lo agrega al principio de la lista', () => {
      fixture.detectChanges();
      httpMock.expectOne(pozosUrl).flush([]);
      fixture.detectChanges();

      const comp = fixture.componentInstance;
      comp.pozoForm.setValue({
        titulo: 'Renault Sandero 2020',
        autoDescripcion: 'Renault Sandero 2020, 50.000km',
        montoObjetivo: 8000,
        imagenUrl: '',
        precioVentaEstimado: 0,
      });
      comp.guardarPozo();

      const req = httpMock.expectOne({ url: pozosUrl, method: 'POST' });
      expect(req.request.body).toEqual({
        titulo: 'Renault Sandero 2020',
        autoDescripcion: 'Renault Sandero 2020, 50.000km',
        montoObjetivo: 8000,
        imagenUrl: '',
        precioVentaEstimado: null,
      });

      const nuevoPozo: Pozo = {
        ...pozoMock,
        id: '2',
        titulo: 'Renault Sandero 2020',
        autoDescripcion: 'Renault Sandero 2020, 50.000km',
        montoObjetivo: 8000,
        montoRecaudado: 0,
      };
      req.flush(nuevoPozo);

      expect(comp.pozos()).toEqual([nuevoPozo]);
      expect(comp.formEnviando()).toBeFalse();
      expect(comp.formExito()).toBeTrue();
    });

    it('edita un pozo existente y lo reemplaza en la lista', () => {
      fixture.detectChanges();
      httpMock.expectOne(pozosUrl).flush([pozoMock]);
      fixture.detectChanges();

      const comp = fixture.componentInstance;
      comp.abrirEditar(pozoMock);
      comp.pozoForm.patchValue({ titulo: 'Fiat Cronos 2022 (actualizado)' });
      comp.guardarPozo();

      const req = httpMock.expectOne({ url: `${pozosUrl}/${pozoMock.id}`, method: 'PUT' });
      expect(req.request.body).toEqual({
        titulo: 'Fiat Cronos 2022 (actualizado)',
        autoDescripcion: pozoMock.autoDescripcion,
        montoObjetivo: pozoMock.montoObjetivo,
        imagenUrl: pozoMock.imagenUrl ?? '',
        precioVentaEstimado: null,
      });

      const pozoActualizado: Pozo = { ...pozoMock, titulo: 'Fiat Cronos 2022 (actualizado)' };
      req.flush(pozoActualizado);

      expect(comp.pozos()).toEqual([pozoActualizado]);
      expect(comp.formEnviando()).toBeFalse();
      expect(comp.formExito()).toBeTrue();
    });

    it('muestra un error si falla el guardado del pozo', () => {
      fixture.detectChanges();
      httpMock.expectOne(pozosUrl).flush([]);
      fixture.detectChanges();

      const comp = fixture.componentInstance;
      comp.pozoForm.setValue({
        titulo: 'Renault Sandero 2020',
        autoDescripcion: 'Renault Sandero 2020, 50.000km',
        montoObjetivo: 8000,
        imagenUrl: '',
        precioVentaEstimado: 0,
      });
      comp.guardarPozo();

      httpMock.expectOne({ url: pozosUrl, method: 'POST' }).flush(
        { error: 'El monto objetivo es invalido.' },
        { status: 400, statusText: 'Bad Request' },
      );

      expect(comp.formError()).toBe('El monto objetivo es invalido.');
      expect(comp.formEnviando()).toBeFalse();
      expect(comp.formExito()).toBeFalse();
      expect(comp.pozos()).toEqual([]);
    });
  });

  describe('confirmarEliminarPozo', () => {
    it('elimina un pozo confirmado y lo saca de la lista', () => {
      fixture.detectChanges();
      httpMock.expectOne(pozosUrl).flush([pozoMock]);
      fixture.detectChanges();

      const comp = fixture.componentInstance;
      comp.eliminarPozo(pozoMock);
      comp.confirmarEliminarPozo();

      httpMock.expectOne({ url: `${pozosUrl}/${pozoMock.id}`, method: 'DELETE' }).flush(null);

      expect(comp.pozos()).toEqual([]);
      expect(comp.eliminarEnviando()).toBeFalse();
      expect(comp.eliminarObjetivo()).toBeNull();
      expect(comp.eliminarError()).toBeNull();
    });

    it('muestra un error si falla la eliminacion del pozo', () => {
      fixture.detectChanges();
      httpMock.expectOne(pozosUrl).flush([pozoMock]);
      fixture.detectChanges();

      const comp = fixture.componentInstance;
      comp.eliminarPozo(pozoMock);
      comp.confirmarEliminarPozo();

      httpMock.expectOne({ url: `${pozosUrl}/${pozoMock.id}`, method: 'DELETE' }).flush(
        { error: 'No se puede eliminar un pozo con inversiones.' },
        { status: 409, statusText: 'Conflict' },
      );

      expect(comp.eliminarError()).toBe('No se puede eliminar un pozo con inversiones.');
      expect(comp.eliminarEnviando()).toBeFalse();
      expect(comp.pozos()).toEqual([pozoMock]);
    });
  });

  describe('ruta /pozos', () => {
    it('es accesible sin usuario logueado, sin authGuard', () => {
      const rutaPozos = routes.find((r) => r.path === 'pozos');
      expect(rutaPozos).toBeTruthy();
      expect(rutaPozos?.canActivate).toBeUndefined();
    });
  });
});
