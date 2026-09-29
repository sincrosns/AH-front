import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Pozo } from '../../services/pozos.service';
import { Calculadora } from './calculadora';

describe('Calculadora', () => {
  let fixture: ComponentFixture<Calculadora>;
  let httpMock: HttpTestingController;

  const pozosUrl = `${environment.apiUrl}/pozos`;

  const pozoAbierto: Pozo = {
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
    precioVentaEstimado: 15000,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Calculadora],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Calculadora);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deberia crearse', () => {
    fixture.detectChanges();
    httpMock.expectOne(pozosUrl).flush([]);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra un estado de carga mientras espera la respuesta', () => {
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Buscando pozos abiertos');

    httpMock.expectOne(pozosUrl).flush([]);
  });

  it('muestra un aviso de sin conexion si falla el pedido de pozos', () => {
    fixture.detectChanges();
    httpMock.expectOne(pozosUrl).flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.componentInstance.errorPozos()).toBeTruthy();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Reintentar');
  });

  it('muestra el mensaje de vacio si no hay pozos abiertos', () => {
    fixture.detectChanges();
    httpMock.expectOne(pozosUrl).flush([{ ...pozoAbierto, estado: 'Vendido' }]);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('No hay pozos abiertos');
  });

  it('preselecciona el primer pozo abierto y autocompleta sus datos', () => {
    fixture.detectChanges();
    httpMock.expectOne(pozosUrl).flush([pozoAbierto]);
    fixture.detectChanges();

    expect(fixture.componentInstance.pozoSeleccionadoId()).toBe('1');
    expect(fixture.componentInstance.montoObjetivo()).toBe(10000);
    expect(fixture.componentInstance.precioVentaEstimado()).toBe(15000);
  });

  describe('gananciaEstimada y porcentajeRetorno', () => {
    it('devuelve null si todavia no hay un monto objetivo cargado', () => {
      fixture.detectChanges();
      httpMock.expectOne(pozosUrl).flush([]);
      fixture.detectChanges();

      expect(fixture.componentInstance.gananciaEstimada()).toBeNull();
    });

    it('calcula la ganancia proporcional al monto sobre el objetivo del pozo', () => {
      fixture.detectChanges();
      httpMock.expectOne(pozosUrl).flush([pozoAbierto]);
      fixture.detectChanges();

      fixture.componentInstance.montoInvertir.set(2000);

      // gananciaTotalEstimada = 15000 - 10000 = 5000; proporcional = 5000 * (2000/10000)
      expect(fixture.componentInstance.gananciaEstimada()).toBe(1000);
      expect(fixture.componentInstance.porcentajeRetorno()).toBe(50);
    });

    it('devuelve 0 si el monto a invertir es 0', () => {
      fixture.detectChanges();
      httpMock.expectOne(pozosUrl).flush([pozoAbierto]);
      fixture.detectChanges();

      fixture.componentInstance.montoInvertir.set(0);

      expect(fixture.componentInstance.gananciaEstimada()).toBe(0);
      expect(fixture.componentInstance.porcentajeRetorno()).toBeNull();
    });
  });
});
