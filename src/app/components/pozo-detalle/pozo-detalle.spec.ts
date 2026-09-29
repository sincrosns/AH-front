import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { PozoDetalle as PozoDetalleModelo } from '../../services/pozos.service';
import { Inversion } from '../../services/inversiones.service';
import { PozoDetalle } from './pozo-detalle';

describe('PozoDetalle', () => {
  let fixture: ComponentFixture<PozoDetalle>;
  let httpMock: HttpTestingController;

  const pozoUrl = `${environment.apiUrl}/pozos/1`;
  const inversionesUrl = `${environment.apiUrl}/pozos/1/inversiones`;

  const pozoMock: PozoDetalleModelo = {
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
    inversiones: [
      { id: 'i1', usuarioId: 'u1', nombreInversor: 'Juan Perez', monto: 4000, fecha: new Date().toISOString() },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PozoDetalle],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PozoDetalle);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deberia crearse', () => {
    fixture.detectChanges();
    httpMock.expectOne(pozoUrl).flush(pozoMock);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra un estado de carga mientras espera la respuesta', () => {
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Cargando');

    httpMock.expectOne(pozoUrl).flush(pozoMock);
  });

  it('muestra los datos del pozo y sus inversores', () => {
    fixture.detectChanges();
    httpMock.expectOne(pozoUrl).flush(pozoMock);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Fiat Cronos 2022');
    expect(texto).toContain('Juan Perez');
  });

  it('aplica el corte de palabra al nombre del inversor para que no desborde la tarjeta', () => {
    fixture.detectChanges();
    const nombreLargo = 'Maria de los Angeles Fernandez Gonzalez Rodriguez';
    httpMock.expectOne(pozoUrl).flush({
      ...pozoMock,
      inversiones: [{ id: 'i1', usuarioId: 'u1', nombreInversor: nombreLargo, monto: 4000, fecha: new Date().toISOString() }],
    });
    fixture.detectChanges();

    const nombreEl = (fixture.nativeElement as HTMLElement).querySelector('.pozo-detalle__item-nombre');
    expect(nombreEl).toBeTruthy();
    expect(nombreEl?.textContent).toContain(nombreLargo);

    const estilos = getComputedStyle(nombreEl as Element);
    expect(estilos.overflowWrap).toBe('break-word');
    expect(estilos.minWidth).toBe('0px');
  });

  it('muestra un estado de error si falla el pedido', () => {
    fixture.detectChanges();
    httpMock.expectOne(pozoUrl).flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.componentInstance.error()).toBeTruthy();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Reintentar');
  });

  it('muestra el formulario de invertir solo si el pozo esta Abierto', () => {
    fixture.detectChanges();
    httpMock.expectOne(pozoUrl).flush({ ...pozoMock, estado: 'Vendido' });
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/pozos/1/reparto`).flush({ gananciaTotal: 0, reparto: [] });

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).not.toContain('Invertir en este pozo');
  });

  it('muestra la tabla de reparto cuando el pozo esta Vendido', () => {
    fixture.detectChanges();
    httpMock
      .expectOne(pozoUrl)
      .flush({ ...pozoMock, estado: 'Vendido', precioCompra: 8000, fechaCompra: new Date().toISOString(), precioVenta: 12000, fechaVenta: new Date().toISOString() });
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/pozos/1/reparto`).flush({
      gananciaTotal: 4000,
      reparto: [{ usuarioId: 'u1', nombreInversor: 'Juan Perez', montoInvertido: 4000, porcentaje: 1, ganancia: 4000 }],
    });
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Reparto de ganancias');
    expect(texto).toContain('Juan Perez');
  });

  it('invierte y muestra confirmacion, recargando el pozo', () => {
    fixture.detectChanges();
    httpMock.expectOne(pozoUrl).flush(pozoMock);
    fixture.detectChanges();

    fixture.componentInstance.invertirForm.setValue({ monto: 500 });
    fixture.componentInstance.invertir();

    const inversionMock: Inversion = { id: 'i2', pozoId: '1', usuarioId: 'u1', monto: 500, fecha: new Date().toISOString() };
    httpMock.expectOne(inversionesUrl).flush(inversionMock);

    httpMock.expectOne(pozoUrl).flush({ ...pozoMock, montoRecaudado: 4500 });
    fixture.detectChanges();

    expect(fixture.componentInstance.invertirExito()).toBeTrue();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Inversion registrada correctamente');
  });

  it('marca el pozo como comprado y muestra confirmacion', () => {
    fixture.detectChanges();
    httpMock.expectOne(pozoUrl).flush(pozoMock);
    fixture.detectChanges();

    fixture.componentInstance.abrirFormComprado();
    fixture.componentInstance.compradoForm.setValue({ precioCompra: 8000, fechaCompra: '2026-01-01' });
    fixture.componentInstance.marcarComprado();

    const req = httpMock.expectOne(`${environment.apiUrl}/pozos/1/estado`);
    expect(req.request.body).toEqual({ accion: 'marcarComprado', precioCompra: 8000, fechaCompra: '2026-01-01' });
    req.flush({ ...pozoMock, estado: 'Comprado', precioCompra: 8000, fechaCompra: '2026-01-01' });

    httpMock.expectOne(pozoUrl).flush({ ...pozoMock, estado: 'Comprado', precioCompra: 8000, fechaCompra: '2026-01-01' });
    fixture.detectChanges();

    expect(fixture.componentInstance.estadoExito()).toBeTrue();
  });

  it('muestra un error si falla marcar el pozo como comprado', () => {
    fixture.detectChanges();
    httpMock.expectOne(pozoUrl).flush(pozoMock);
    fixture.detectChanges();

    fixture.componentInstance.abrirFormComprado();
    fixture.componentInstance.compradoForm.setValue({ precioCompra: 8000, fechaCompra: '2026-01-01' });
    fixture.componentInstance.marcarComprado();

    httpMock
      .expectOne(`${environment.apiUrl}/pozos/1/estado`)
      .flush({ error: 'El pozo no esta abierto.' }, { status: 409, statusText: 'Conflict' });

    expect(fixture.componentInstance.compradoError()).toBe('El pozo no esta abierto.');
    expect(fixture.componentInstance.marcandoComprado()).toBeFalse();
  });

  it('muestra un error si falla invertir en el pozo', () => {
    fixture.detectChanges();
    httpMock.expectOne(pozoUrl).flush(pozoMock);
    fixture.detectChanges();

    fixture.componentInstance.invertirForm.setValue({ monto: 500 });
    fixture.componentInstance.invertir();

    httpMock
      .expectOne(inversionesUrl)
      .flush({ error: 'El pozo ya no esta abierto.' }, { status: 409, statusText: 'Conflict' });

    expect(fixture.componentInstance.invertirError()).toBe('El pozo ya no esta abierto.');
    expect(fixture.componentInstance.invirtiendo()).toBeFalse();
  });

  it('marca el pozo como vendido y muestra confirmacion', () => {
    fixture.detectChanges();
    httpMock
      .expectOne(pozoUrl)
      .flush({ ...pozoMock, estado: 'Comprado', precioCompra: 8000, fechaCompra: '2026-01-01' });
    fixture.detectChanges();

    fixture.componentInstance.abrirFormVendido();
    fixture.componentInstance.ventaForm.setValue({ precioVenta: 12000, fechaVenta: '2026-02-01' });
    fixture.componentInstance.marcarVendido();

    const req = httpMock.expectOne(`${environment.apiUrl}/pozos/1/estado`);
    expect(req.request.body).toEqual({ accion: 'marcarVendido', precioVenta: 12000, fechaVenta: '2026-02-01' });
    req.flush({ ...pozoMock, estado: 'Vendido', precioVenta: 12000, fechaVenta: '2026-02-01' });

    httpMock
      .expectOne(pozoUrl)
      .flush({ ...pozoMock, estado: 'Vendido', precioVenta: 12000, fechaVenta: '2026-02-01' });
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/pozos/1/reparto`).flush({ gananciaTotal: 4000, reparto: [] });
    fixture.detectChanges();

    expect(fixture.componentInstance.estadoExito()).toBeTrue();
  });

  it('muestra un error si falla marcar el pozo como vendido', () => {
    fixture.detectChanges();
    httpMock
      .expectOne(pozoUrl)
      .flush({ ...pozoMock, estado: 'Comprado', precioCompra: 8000, fechaCompra: '2026-01-01' });
    fixture.detectChanges();

    fixture.componentInstance.abrirFormVendido();
    fixture.componentInstance.ventaForm.setValue({ precioVenta: 12000, fechaVenta: '2026-02-01' });
    fixture.componentInstance.marcarVendido();

    httpMock
      .expectOne(`${environment.apiUrl}/pozos/1/estado`)
      .flush({ error: 'El pozo no esta comprado.' }, { status: 409, statusText: 'Conflict' });

    expect(fixture.componentInstance.ventaError()).toBe('El pozo no esta comprado.');
    expect(fixture.componentInstance.marcandoVendido()).toBeFalse();
  });

  it('guarda la edicion de una inversion propia y recarga el pozo', () => {
    fixture.detectChanges();
    httpMock.expectOne(pozoUrl).flush(pozoMock);
    fixture.detectChanges();

    const inv = pozoMock.inversiones[0];
    fixture.componentInstance.abrirEditarInversion(inv);
    fixture.componentInstance.editForm.setValue({ monto: 6000 });
    fixture.componentInstance.guardarInversion();

    const req = httpMock.expectOne(`${environment.apiUrl}/inversiones/${inv.id}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ monto: 6000 });
    req.flush({ id: inv.id, pozoId: '1', usuarioId: 'u1', monto: 6000, fecha: new Date().toISOString() });

    httpMock.expectOne(pozoUrl).flush({ ...pozoMock, montoRecaudado: 6000 });
    fixture.detectChanges();

    expect(fixture.componentInstance.editExito()).toBeTrue();
  });

  it('muestra un error si falla la edicion de una inversion propia', () => {
    fixture.detectChanges();
    httpMock.expectOne(pozoUrl).flush(pozoMock);
    fixture.detectChanges();

    const inv = pozoMock.inversiones[0];
    fixture.componentInstance.abrirEditarInversion(inv);
    fixture.componentInstance.editForm.setValue({ monto: 6000 });
    fixture.componentInstance.guardarInversion();

    httpMock
      .expectOne(`${environment.apiUrl}/inversiones/${inv.id}`)
      .flush({ error: 'El pozo dejo de estar abierto.' }, { status: 409, statusText: 'Conflict' });

    expect(fixture.componentInstance.editError()).toBe('El pozo dejo de estar abierto.');
    expect(fixture.componentInstance.editEnviando()).toBeFalse();
  });

  it('elimina una inversion propia tras confirmar y recarga el pozo', () => {
    fixture.detectChanges();
    httpMock.expectOne(pozoUrl).flush(pozoMock);
    fixture.detectChanges();

    const inv = pozoMock.inversiones[0];
    fixture.componentInstance.eliminarInversion(inv);
    fixture.componentInstance.confirmarEliminarInversion();

    const req = httpMock.expectOne(`${environment.apiUrl}/inversiones/${inv.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    httpMock.expectOne(pozoUrl).flush({ ...pozoMock, montoRecaudado: 0, inversiones: [] });
    fixture.detectChanges();

    expect(fixture.componentInstance.eliminarEnviando()).toBeFalse();
    expect(fixture.componentInstance.eliminarError()).toBeNull();
  });

  it('muestra un error si falla la eliminacion de una inversion propia', () => {
    fixture.detectChanges();
    httpMock.expectOne(pozoUrl).flush(pozoMock);
    fixture.detectChanges();

    const inv = pozoMock.inversiones[0];
    fixture.componentInstance.eliminarInversion(inv);
    fixture.componentInstance.confirmarEliminarInversion();

    httpMock
      .expectOne(`${environment.apiUrl}/inversiones/${inv.id}`)
      .flush({ error: 'No podes eliminar esta inversion.' }, { status: 403, statusText: 'Forbidden' });

    expect(fixture.componentInstance.eliminarError()).toBe('No podes eliminar esta inversion.');
    expect(fixture.componentInstance.eliminarEnviando()).toBeFalse();
  });

  describe('gananciaEstimada', () => {
    it('devuelve null si el pozo no tiene precioVentaEstimado cargado', () => {
      fixture.detectChanges();
      httpMock.expectOne(pozoUrl).flush(pozoMock);
      fixture.detectChanges();

      fixture.componentInstance.invertirForm.setValue({ monto: 2000 });

      expect(fixture.componentInstance.gananciaEstimada()).toBeNull();
    });

    it('calcula la ganancia proporcional al monto sobre el objetivo del pozo', () => {
      fixture.detectChanges();
      httpMock.expectOne(pozoUrl).flush({ ...pozoMock, precioVentaEstimado: 15000 });
      fixture.detectChanges();

      fixture.componentInstance.invertirForm.setValue({ monto: 2000 });

      // gananciaTotalEstimada = 15000 - 10000 = 5000; proporcional = 5000 * (2000/10000)
      expect(fixture.componentInstance.gananciaEstimada()).toBe(1000);
    });

    it('devuelve 0 si el monto ingresado es 0', () => {
      fixture.detectChanges();
      httpMock.expectOne(pozoUrl).flush({ ...pozoMock, precioVentaEstimado: 15000 });
      fixture.detectChanges();

      fixture.componentInstance.invertirForm.setValue({ monto: 0 });

      expect(fixture.componentInstance.gananciaEstimada()).toBe(0);
    });

    it('devuelve 0 si el monto ingresado es negativo', () => {
      fixture.detectChanges();
      httpMock.expectOne(pozoUrl).flush({ ...pozoMock, precioVentaEstimado: 15000 });
      fixture.detectChanges();

      fixture.componentInstance.invertirForm.setValue({ monto: -100 });

      expect(fixture.componentInstance.gananciaEstimada()).toBe(0);
    });
  });
});
