import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TarjetaPozo } from './tarjeta-pozo';

describe('TarjetaPozo', () => {
  let fixture: ComponentFixture<TarjetaPozo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaPozo],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaPozo);
  });

  it('deberia crearse', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra la imagen por defecto cuando no hay imagenUrl', () => {
    fixture.detectChanges();

    const img = (fixture.nativeElement as HTMLElement).querySelector<HTMLImageElement>(
      '.tarjeta-pozo__imagen img',
    );
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBe('/imagenes/auto.jpg');
  });

  it('muestra la imagen cuando hay imagenUrl', () => {
    fixture.componentRef.setInput('imagenUrl', 'https://ejemplo.com/foto.jpg');
    fixture.detectChanges();

    const img = (fixture.nativeElement as HTMLElement).querySelector<HTMLImageElement>(
      '.tarjeta-pozo__imagen img',
    );
    expect(img).toBeTruthy();
    expect(img?.src).toBe('https://ejemplo.com/foto.jpg');
  });

  it('vuelve a la imagen por defecto si la imagen dispara error de carga', () => {
    fixture.componentRef.setInput('imagenUrl', 'https://cdn.example.com/roto.jpg');
    fixture.detectChanges();

    const nativeEl = fixture.nativeElement as HTMLElement;
    const img = nativeEl.querySelector<HTMLImageElement>('.tarjeta-pozo__imagen img');
    expect(img).toBeTruthy();

    img?.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    const imgDespues = nativeEl.querySelector<HTMLImageElement>('.tarjeta-pozo__imagen img');
    expect(imgDespues).toBeTruthy();
    expect(imgDespues?.getAttribute('src')).toBe('/imagenes/auto.jpg');
  });

  describe('progreso', () => {
    it('devuelve 0 cuando montoObjetivo es 0, sin dividir por cero', () => {
      fixture.componentRef.setInput('montoObjetivo', 0);
      fixture.componentRef.setInput('montoRecaudado', 500);
      expect(fixture.componentInstance.progreso()).toBe(0);
    });

    it('topea en 100 cuando montoRecaudado supera montoObjetivo', () => {
      fixture.componentRef.setInput('montoObjetivo', 1000);
      fixture.componentRef.setInput('montoRecaudado', 5000);
      expect(fixture.componentInstance.progreso()).toBe(100);
    });

    it('calcula el porcentaje redondeado en el caso normal', () => {
      fixture.componentRef.setInput('montoObjetivo', 10000);
      fixture.componentRef.setInput('montoRecaudado', 4000);
      expect(fixture.componentInstance.progreso()).toBe(40);
    });
  });

  describe('formatoMonto', () => {
    it('formatea el monto en pesos argentinos, sin decimales', () => {
      const texto = fixture.componentInstance.formatoMonto(1500000);
      expect(texto).toContain('$');
      expect(texto).toContain('1.500.000');
      expect(texto).not.toContain(',00');
    });

    it('formatea el 0 como $0', () => {
      const texto = fixture.componentInstance.formatoMonto(0);
      expect(texto).toContain('0');
      expect(texto).toContain('$');
    });
  });

  describe('badge de estado', () => {
    it('se ubica junto al titulo cuando badgeEnImagen es false', () => {
      fixture.componentRef.setInput('estado', 'Abierto');
      fixture.detectChanges();

      const nativeEl = fixture.nativeElement as HTMLElement;
      expect(nativeEl.querySelector('.tarjeta-pozo__hd .tarjeta-pozo__badge')).toBeTruthy();
      expect(nativeEl.querySelector('.tarjeta-pozo__badge--sobre-imagen')).toBeFalsy();
    });

    it('se superpone a la imagen cuando badgeEnImagen es true', () => {
      fixture.componentRef.setInput('estado', 'Comprado');
      fixture.componentRef.setInput('badgeEnImagen', true);
      fixture.detectChanges();

      const nativeEl = fixture.nativeElement as HTMLElement;
      expect(nativeEl.querySelector('.tarjeta-pozo__badge--sobre-imagen')).toBeTruthy();
      expect(nativeEl.querySelector('.tarjeta-pozo__hd .tarjeta-pozo__badge')).toBeFalsy();
    });
  });

  it('arma el routerLink con el link recibido', () => {
    fixture.componentRef.setInput('link', ['/pozos', '5']);
    fixture.detectChanges();

    const a = (fixture.nativeElement as HTMLElement).querySelector('a.tarjeta-pozo__link');
    expect(a).toBeTruthy();
  });

  it('no arma un link si no se pasa la ruta', () => {
    fixture.detectChanges();

    const a = (fixture.nativeElement as HTMLElement).querySelector('a.tarjeta-pozo__link');
    expect(a).toBeFalsy();
  });
});
