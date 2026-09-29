import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pozo } from '../../services/pozos.service';
import { CarruselPozos } from './carrusel-pozos';

describe('CarruselPozos', () => {
  let fixture: ComponentFixture<CarruselPozos>;

  const crearPozo = (overrides: Partial<Pozo> = {}): Pozo => ({
    id: 'pozo-1',
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
    ...overrides,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarruselPozos],
    }).compileComponents();

    fixture = TestBed.createComponent(CarruselPozos);
    fixture.componentRef.setInput('titulo', 'Pozos disponibles');
  });

  it('deberia crearse', () => {
    fixture.componentRef.setInput('pozos', []);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('boton "Pozo siguiente"', () => {
    it('llama a scrollBy del contenedor del carrusel al hacer click, sin tirar error', () => {
      fixture.componentRef.setInput('pozos', [crearPozo()]);
      fixture.detectChanges();

      const nativeEl = fixture.nativeElement as HTMLElement;
      const carruselEl = nativeEl.querySelector('.carrusel-pozos__carrusel') as HTMLElement;
      const scrollBySpy = spyOn(carruselEl, 'scrollBy');

      const btnSiguiente = nativeEl.querySelector<HTMLButtonElement>(
        'button[aria-label="Pozo siguiente"]',
      );

      expect(() => btnSiguiente?.click()).not.toThrow();
      expect(scrollBySpy).toHaveBeenCalledTimes(1);
      expect(scrollBySpy.calls.mostRecent().args[0]).toEqual(
        jasmine.objectContaining({ behavior: 'smooth', left: jasmine.any(Number) }),
      );
    });
  });

  describe('indicador de deslizar en mobile', () => {
    it('se muestra cuando hay mas de una tarjeta', () => {
      fixture.componentRef.setInput('pozos', [crearPozo({ id: 'pozo-1' }), crearPozo({ id: 'pozo-2' })]);
      fixture.detectChanges();

      const hint = (fixture.nativeElement as HTMLElement).querySelector('.carrusel-pozos__hint-mobile');
      expect(hint).toBeTruthy();
      expect(hint?.textContent).toContain('Desliza');
    });

    it('no se muestra cuando hay una sola tarjeta', () => {
      fixture.componentRef.setInput('pozos', [crearPozo()]);
      fixture.detectChanges();

      const hint = (fixture.nativeElement as HTMLElement).querySelector('.carrusel-pozos__hint-mobile');
      expect(hint).toBeFalsy();
    });
  });
});
