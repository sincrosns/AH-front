import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { MiInversion } from '../../services/inversiones.service';
import { Pozo } from '../../services/pozos.service';
import { Home } from './home';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let httpMock: HttpTestingController;

  const meUrl = `${environment.apiUrl}/usuarios/me`;
  const inversionesUrl = `${environment.apiUrl}/usuarios/me/inversiones`;
  const pozosUrl = `${environment.apiUrl}/pozos`;

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

  const misInversionesMock: MiInversion[] = [
    {
      id: 'inv-1',
      pozoId: 'pozo-1',
      tituloPozo: 'Pozo Norte',
      autoDescripcion: 'Fiat Cronos 2021',
      estadoPozo: 'Comprado',
      imagenUrl: null,
      monto: 1000,
      fecha: new Date().toISOString(),
      gananciaCorrespondiente: null,
    },
    {
      id: 'inv-2',
      pozoId: 'pozo-2',
      tituloPozo: 'Pozo Sur',
      autoDescripcion: 'Toyota Corolla 2018',
      estadoPozo: 'Vendido',
      imagenUrl: null,
      monto: 500,
      fecha: new Date().toISOString(),
      gananciaCorrespondiente: 200,
    },
    {
      id: 'inv-3',
      pozoId: 'pozo-1',
      tituloPozo: 'Pozo Norte',
      autoDescripcion: 'Fiat Cronos 2021',
      estadoPozo: 'Comprado',
      imagenUrl: null,
      monto: 300,
      fecha: new Date().toISOString(),
      gananciaCorrespondiente: null,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deberia crearse', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);
    httpMock.expectOne(inversionesUrl).flush([]);
    httpMock.expectOne(pozosUrl).flush([]);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra un estado de carga mientras espera la respuesta', () => {
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Cargando');

    httpMock.expectOne(meUrl).flush(usuarioMock);
    httpMock.expectOne(inversionesUrl).flush([]);
    httpMock.expectOne(pozosUrl).flush([]);
  });

  it('muestra los datos del usuario logueado', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);
    httpMock.expectOne(inversionesUrl).flush([]);
    httpMock.expectOne(pozosUrl).flush([]);
    fixture.detectChanges();

    expect(fixture.componentInstance.usuario()).toEqual(usuarioMock);
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Ana');
    expect(texto).toContain('ana@test.com');
  });

  it('muestra "Primera vez" cuando ultimoAcceso es null', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush({ ...usuarioMock, ultimoAcceso: null });
    httpMock.expectOne(inversionesUrl).flush([]);
    httpMock.expectOne(pozosUrl).flush([]);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Primera vez');
  });

  it('muestra un estado de error real (no se queda en Cargando) si falla el pedido', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush({ error: 'No se pudo conectar' }, { status: 0, statusText: 'Unknown Error' });
    httpMock.expectOne(inversionesUrl).flush([]);
    httpMock.expectOne(pozosUrl).flush([]);
    fixture.detectChanges();

    expect(fixture.componentInstance.error()).toBeTruthy();
    expect(fixture.componentInstance.cargando()).toBeFalse();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).not.toContain('Cargando...');
    expect(texto).toContain('Reintentar');
  });

  it('reintenta el pedido al hacer click en Reintentar', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(null, { status: 500, statusText: 'Server Error' });
    httpMock.expectOne(inversionesUrl).flush([]);
    httpMock.expectOne(pozosUrl).flush([]);
    fixture.detectChanges();

    fixture.componentInstance.reintentar();
    fixture.detectChanges();
    expect(fixture.componentInstance.cargando()).toBeTrue();

    httpMock.expectOne(meUrl).flush(usuarioMock);
    fixture.detectChanges();

    expect(fixture.componentInstance.usuario()).toEqual(usuarioMock);
    expect(fixture.componentInstance.error()).toBeNull();
  });

  it('si AuthService ya tiene el usuario (lo dejo el guard), lo muestra de entrada sin pasar por el spinner del bloque principal y lo refresca en segundo plano', () => {
    const authSvc = TestBed.inject(AuthService);
    authSvc.actualizarUsuarioActual(usuarioMock);

    const fixtureConSesion = TestBed.createComponent(Home);
    fixtureConSesion.detectChanges();

    const nativeEl = fixtureConSesion.nativeElement as HTMLElement;
    expect(nativeEl.querySelector('.home__cargando')).toBeFalsy();
    expect(nativeEl.querySelector('.home__cards')).toBeTruthy();
    expect(nativeEl.textContent ?? '').toContain('Ana');

    // El pedido a /usuarios/me se sigue haciendo (refresco en segundo plano),
    // solo que ya no bloquea la primera pintura con el spinner.
    httpMock.expectOne(meUrl).flush(usuarioMock);
    httpMock.expectOne(inversionesUrl).flush([]);
    httpMock.expectOne(pozosUrl).flush([]);
  });

  it('sincroniza el usuario cargado con AuthService', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);
    httpMock.expectOne(inversionesUrl).flush([]);
    httpMock.expectOne(pozosUrl).flush([]);

    const authSvc = TestBed.inject(AuthService);
    expect(authSvc.usuarioActual()).toEqual(usuarioMock);
  });

  it('calcula totalInvertido, gananciaTotal y cantidadPozosActivos a partir de mis inversiones', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);
    httpMock.expectOne(inversionesUrl).flush(misInversionesMock);
    httpMock.expectOne(pozosUrl).flush([]);
    fixture.detectChanges();

    // totalInvertido: suma de montos en pozos que no estan Vendidos (1000 + 300)
    expect(fixture.componentInstance.totalInvertido()).toBe(1300);
    // gananciaTotal: suma de gananciaCorrespondiente de todas las inversiones (0 + 200 + 0)
    expect(fixture.componentInstance.gananciaTotal()).toBe(200);
    // cantidadPozosActivos: pozos unicos no Vendidos (solo pozo-1)
    expect(fixture.componentInstance.cantidadPozosActivos()).toBe(1);
    expect(fixture.componentInstance.cargandoInversiones()).toBeFalse();
  });

  it('muestra el detalle de las ultimas inversiones (pozo, monto y fecha) en el sidebar', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);
    httpMock.expectOne(inversionesUrl).flush(misInversionesMock);
    httpMock.expectOne(pozosUrl).flush([]);
    fixture.detectChanges();

    expect(fixture.componentInstance.ultimasInversiones().length).toBe(3);
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Ultimos movimientos');
    expect(texto).toContain('Pozo Norte');
    expect(texto).toContain('Pozo Sur');
    expect(texto).toContain(fixture.componentInstance.formatoMonto(1000));
    expect(texto).toContain(fixture.componentInstance.formatoMonto(500));
  });

  it('no muestra el detalle de ultimos movimientos si no hay inversiones', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);
    httpMock.expectOne(inversionesUrl).flush([]);
    httpMock.expectOne(pozosUrl).flush([]);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).not.toContain('Ultimos movimientos');
  });

  it('deja cargandoInversiones en false si falla el pedido de mis inversiones', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);
    httpMock
      .expectOne(inversionesUrl)
      .flush({ error: 'No se pudo conectar' }, { status: 0, statusText: 'Unknown Error' });
    httpMock.expectOne(pozosUrl).flush([]);
    fixture.detectChanges();

    expect(fixture.componentInstance.cargandoInversiones()).toBeFalse();
    expect(fixture.componentInstance.misInversiones()).toEqual([]);
    expect(fixture.componentInstance.totalInvertido()).toBe(0);
    expect(fixture.componentInstance.gananciaTotal()).toBe(0);
    expect(fixture.componentInstance.cantidadPozosActivos()).toBe(0);
  });

  it('llama a PozosService.listar() y muestra el estado vacio cuando no hay pozos', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);
    httpMock.expectOne(inversionesUrl).flush([]);
    httpMock.expectOne(pozosUrl).flush([]);
    fixture.detectChanges();

    expect(fixture.componentInstance.pozosDisponibles()).toEqual([]);
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('No hay pozos abiertos para invertir en este momento.');
  });

  it('ordena los pozos disponibles por fechaCreacion descendente', () => {
    const pozosMock: Pozo[] = Array.from({ length: 8 }, (_, i) => ({
      id: `pozo-${i}`,
      titulo: `Pozo ${i}`,
      autoDescripcion: 'auto',
      montoObjetivo: 1000,
      montoRecaudado: 0,
      estado: 'Abierto',
      fechaCreacion: new Date(2024, 0, i + 1).toISOString(),
      precioCompra: null,
      fechaCompra: null,
      precioVenta: null,
      fechaVenta: null,
      imagenUrl: null,
      precioVentaEstimado: null,
    }));

    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);
    httpMock.expectOne(inversionesUrl).flush([]);
    httpMock.expectOne(pozosUrl).flush(pozosMock);
    fixture.detectChanges();

    const disponibles = fixture.componentInstance.pozosDisponibles();
    expect(disponibles.length).toBe(8);
    expect(disponibles[0].id).toBe('pozo-7');
    expect(disponibles[7].id).toBe('pozo-0');
  });

  it('filtra y muestra solo los pozos con estado Abierto', () => {
    const pozosMock: Pozo[] = [
      {
        id: 'pozo-abierto',
        titulo: 'Pozo Abierto',
        autoDescripcion: 'auto',
        montoObjetivo: 1000,
        montoRecaudado: 0,
        estado: 'Abierto',
        fechaCreacion: new Date(2024, 0, 1).toISOString(),
        precioCompra: null,
        fechaCompra: null,
        precioVenta: null,
        fechaVenta: null,
        imagenUrl: null,
        precioVentaEstimado: null,
      },
      {
        id: 'pozo-comprado',
        titulo: 'Pozo Comprado',
        autoDescripcion: 'auto',
        montoObjetivo: 1000,
        montoRecaudado: 1000,
        estado: 'Comprado',
        fechaCreacion: new Date(2024, 0, 2).toISOString(),
        precioCompra: 900,
        fechaCompra: new Date().toISOString(),
        precioVenta: null,
        fechaVenta: null,
        imagenUrl: null,
        precioVentaEstimado: null,
      },
      {
        id: 'pozo-vendido',
        titulo: 'Pozo Vendido',
        autoDescripcion: 'auto',
        montoObjetivo: 1000,
        montoRecaudado: 1000,
        estado: 'Vendido',
        fechaCreacion: new Date(2024, 0, 3).toISOString(),
        precioCompra: 900,
        fechaCompra: new Date().toISOString(),
        precioVenta: 1200,
        fechaVenta: new Date().toISOString(),
        imagenUrl: null,
        precioVentaEstimado: null,
      },
    ];

    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);
    httpMock.expectOne(inversionesUrl).flush([]);
    httpMock.expectOne(pozosUrl).flush(pozosMock);
    fixture.detectChanges();

    const disponibles = fixture.componentInstance.pozosDisponibles();
    expect(disponibles.length).toBe(1);
    expect(disponibles[0].id).toBe('pozo-abierto');

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Pozo Abierto');
    expect(texto).not.toContain('Pozo Comprado');
    expect(texto).not.toContain('Pozo Vendido');
  });

  it('el carrusel muestra la cantidad correcta de tarjetas cuando hay varios pozos', () => {
    const pozosMock: Pozo[] = Array.from({ length: 3 }, (_, i) => ({
      id: `pozo-${i}`,
      titulo: `Pozo ${i}`,
      autoDescripcion: 'auto',
      montoObjetivo: 1000,
      montoRecaudado: 200,
      estado: 'Abierto',
      fechaCreacion: new Date(2024, 0, i + 1).toISOString(),
      precioCompra: null,
      fechaCompra: null,
      precioVenta: null,
      fechaVenta: null,
      imagenUrl: null,
      precioVentaEstimado: null,
    }));

    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);
    httpMock.expectOne(inversionesUrl).flush([]);
    httpMock.expectOne(pozosUrl).flush(pozosMock);
    fixture.detectChanges();

    const tarjetas = (fixture.nativeElement as HTMLElement).querySelectorAll('.carrusel-pozos__item');
    expect(tarjetas.length).toBe(3);
  });

  it('desplazarCarrusel llama a scrollBy del carrusel al hacer click en prev y next', () => {
    const pozosMock: Pozo[] = Array.from({ length: 3 }, (_, i) => ({
      id: `pozo-${i}`,
      titulo: `Pozo ${i}`,
      autoDescripcion: 'auto',
      montoObjetivo: 1000,
      montoRecaudado: 200,
      estado: 'Abierto',
      fechaCreacion: new Date(2024, 0, i + 1).toISOString(),
      precioCompra: null,
      fechaCompra: null,
      precioVenta: null,
      fechaVenta: null,
      imagenUrl: null,
      precioVentaEstimado: null,
    }));

    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);
    httpMock.expectOne(inversionesUrl).flush([]);
    httpMock.expectOne(pozosUrl).flush(pozosMock);
    fixture.detectChanges();

    const nativeEl = fixture.nativeElement as HTMLElement;
    const carruselEl = nativeEl.querySelector('.carrusel-pozos__carrusel') as HTMLElement;
    const scrollBySpy = spyOn(carruselEl, 'scrollBy');

    const btnPrev = nativeEl.querySelector<HTMLButtonElement>('.carrusel-pozos__btn--prev');
    btnPrev?.click();
    expect(scrollBySpy).toHaveBeenCalledTimes(1);
    const argsPrev = scrollBySpy.calls.mostRecent().args[0] as ScrollToOptions;
    expect(argsPrev).toEqual(jasmine.objectContaining({ behavior: 'smooth', left: jasmine.any(Number) }));
    expect(argsPrev.left).toBeLessThan(0);

    const btnNext = nativeEl.querySelector<HTMLButtonElement>('.carrusel-pozos__btn--next');
    btnNext?.click();
    expect(scrollBySpy).toHaveBeenCalledTimes(2);
    const argsNext = scrollBySpy.calls.mostRecent().args[0] as ScrollToOptions;
    expect(argsNext.left).toBeGreaterThan(0);
  });

  it('muestra la imagen real del pozo cuando el back manda imagenUrl (no cae al SVG placeholder)', () => {
    const pozosMock: Pozo[] = [
      {
        id: 'pozo-1',
        titulo: 'Pozo con foto',
        autoDescripcion: 'auto',
        montoObjetivo: 1000,
        montoRecaudado: 200,
        estado: 'Abierto',
        fechaCreacion: new Date().toISOString(),
        precioCompra: null,
        fechaCompra: null,
        precioVenta: null,
        fechaVenta: null,
        imagenUrl: 'https://example.com/auto.jpg',
        precioVentaEstimado: null,
      },
    ];

    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);
    httpMock.expectOne(inversionesUrl).flush([]);
    httpMock.expectOne(pozosUrl).flush(pozosMock);
    fixture.detectChanges();

    const nativeEl = fixture.nativeElement as HTMLElement;
    const img = nativeEl.querySelector<HTMLImageElement>('.tarjeta-pozo__imagen img');
    expect(img).toBeTruthy();
    expect(img?.src).toBe('https://example.com/auto.jpg');
    expect(nativeEl.querySelector('.tarjeta-pozo__imagen svg')).toBeFalsy();
  });

  it('muestra el estimado de venta cuando el pozo lo tiene', () => {
    const pozosMock: Pozo[] = [
      {
        id: 'pozo-1',
        titulo: 'Pozo con estimado',
        autoDescripcion: 'auto',
        montoObjetivo: 1000,
        montoRecaudado: 200,
        estado: 'Abierto',
        fechaCreacion: new Date().toISOString(),
        precioCompra: null,
        fechaCompra: null,
        precioVenta: null,
        fechaVenta: null,
        imagenUrl: null,
        precioVentaEstimado: 1500000,
      },
    ];

    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);
    httpMock.expectOne(inversionesUrl).flush([]);
    httpMock.expectOne(pozosUrl).flush(pozosMock);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Estimado de venta');
    expect(texto).toContain(
      fixture.componentInstance.formatoMonto(1500000),
    );
  });

  it('muestra los dias desde que se abrio cuando el pozo no tiene estimado de venta', () => {
    const fechaHaceTresDias = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const pozosMock: Pozo[] = [
      {
        id: 'pozo-1',
        titulo: 'Pozo sin estimado',
        autoDescripcion: 'auto',
        montoObjetivo: 1000,
        montoRecaudado: 200,
        estado: 'Abierto',
        fechaCreacion: fechaHaceTresDias,
        precioCompra: null,
        fechaCompra: null,
        precioVenta: null,
        fechaVenta: null,
        imagenUrl: null,
        precioVentaEstimado: null,
      },
    ];

    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);
    httpMock.expectOne(inversionesUrl).flush([]);
    httpMock.expectOne(pozosUrl).flush(pozosMock);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Abierto hace 3 dias');
  });

  it('muestra el estado de error del carrusel cuando falla el pedido de pozos', () => {
    fixture.detectChanges();
    httpMock.expectOne(meUrl).flush(usuarioMock);
    httpMock.expectOne(inversionesUrl).flush([]);
    httpMock
      .expectOne(pozosUrl)
      .flush({ error: 'No se pudieron cargar los pozos recientes.' }, { status: 0, statusText: 'Unknown Error' });
    fixture.detectChanges();

    expect(fixture.componentInstance.errorPozos()).toBeTruthy();
    expect(fixture.componentInstance.cargandoPozos()).toBeFalse();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('No se pudieron cargar los pozos recientes.');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.carrusel-pozos__item').length).toBe(0);
  });

});
