import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService, Usuario } from '../../services/auth.service';
import { UsuariosService } from '../../services/usuarios.service';
import { InversionesService, MiInversion } from '../../services/inversiones.service';
import { Pozo, PozosService } from '../../services/pozos.service';
import { Spinner } from '../spinner/spinner';
import { CarruselPozos } from '../carrusel-pozos/carrusel-pozos';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DatePipe, RouterLink, Spinner, CarruselPozos],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly authSvc = inject(AuthService);
  private readonly usuariosSvc = inject(UsuariosService);
  private readonly inversionesSvc = inject(InversionesService);
  private readonly pozosSvc = inject(PozosService);

  /**
   * Arranca con el usuario que ya trajo AuthService (el guard espero a que
   * verificandoSesion terminara antes de dejar entrar a esta ruta, asi que
   * en el 99% de los casos reales ya esta disponible sin pedir de nuevo).
   * Evita el parpadeo de "Cargando..." en el bloque principal mientras se
   * espera un round-trip que ya no hace falta esperar para mostrar algo.
   */
  readonly usuario = signal<Usuario | null>(this.authSvc.usuarioActual());
  readonly cargando = signal(!this.authSvc.usuarioActual());
  readonly error = signal<string | null>(null);

  readonly misInversiones = signal<MiInversion[]>([]);
  readonly cargandoInversiones = signal(true);

  readonly pozosDisponibles = signal<Pozo[]>([]);
  readonly cargandoPozos = signal(true);
  readonly errorPozos = signal<string | null>(null);

  /** Suma de lo invertido en pozos que todavia no se vendieron. */
  readonly totalInvertido = computed(() =>
    this.misInversiones()
      .filter((i) => i.estadoPozo !== 'Vendido')
      .reduce((acc, i) => acc + i.monto, 0),
  );

  /** Suma de la ganancia ya correspondida en pozos vendidos. */
  readonly gananciaTotal = computed(() =>
    this.misInversiones().reduce((acc, i) => acc + (i.gananciaCorrespondiente ?? 0), 0),
  );

  readonly cantidadPozosActivos = computed(
    () => new Set(this.misInversiones().filter((i) => i.estadoPozo !== 'Vendido').map((i) => i.pozoId)).size,
  );

  /** Las 3 inversiones mas recientes, para el detalle "a nivel de pedido" del sidebar. */
  readonly ultimasInversiones = computed(() =>
    [...this.misInversiones()]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 3),
  );

  /** Saludo segun la hora del dia. */
  readonly saludo = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos dias';
    if (h < 20) return 'Buenas tardes';
    return 'Buenas noches';
  });

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarInversiones();
    this.cargarPozosDisponibles();
  }

  /** Reintenta el pedido tras un error (boton "Reintentar"). */
  reintentar(): void {
    this.cargarUsuario();
  }

  /** Reintenta la carga de pozos disponibles tras un error (boton "Reintentar"). */
  reintentarPozos(): void {
    this.cargarPozosDisponibles();
  }

  /** Monto formateado en pesos, sin decimales. */
  formatoMonto(monto: number): string {
    return monto.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    });
  }

  /** Dias transcurridos desde que se creo el pozo, para mostrar "Abierto hace N dias". */
  diasDesdeApertura(pozo: Pozo): number {
    const ms = Date.now() - new Date(pozo.fechaCreacion).getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  }

  private cargarUsuario(): void {
    // Si ya tenemos usuario (via AuthService), este pedido es un refresco en
    // segundo plano: no volvemos a mostrar el spinner para no tapar datos
    // que la persona ya esta viendo.
    if (!this.usuario()) {
      this.cargando.set(true);
    }
    this.error.set(null);

    this.usuariosSvc.obtenerMe().subscribe({
      next: (usuario) => {
        this.usuario.set(usuario);
        this.authSvc.actualizarUsuarioActual(usuario);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.error ?? 'No se pudo cargar tu cuenta. Revisa tu conexion.');
        this.cargando.set(false);
      },
    });
  }

  private cargarInversiones(): void {
    this.cargandoInversiones.set(true);

    this.inversionesSvc.misInversiones().subscribe({
      next: (inversiones) => {
        this.misInversiones.set(inversiones);
        this.cargandoInversiones.set(false);
      },
      error: () => {
        this.cargandoInversiones.set(false);
      },
    });
  }

  private cargarPozosDisponibles(): void {
    this.cargandoPozos.set(true);
    this.errorPozos.set(null);

    this.pozosSvc.listar().subscribe({
      next: (pozos) => {
        const disponibles = pozos
          .filter((p) => p.estado === 'Abierto')
          .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
        this.pozosDisponibles.set(disponibles);
        this.cargandoPozos.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorPozos.set(err.error?.error ?? 'No se pudieron cargar los pozos disponibles para invertir.');
        this.cargandoPozos.set(false);
      },
    });
  }
}
