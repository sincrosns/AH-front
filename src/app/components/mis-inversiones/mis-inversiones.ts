import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { InversionesService, MiInversion } from '../../services/inversiones.service';
import { Spinner } from '../spinner/spinner';
import { TarjetaPozo } from '../tarjeta-pozo/tarjeta-pozo';

@Component({
  selector: 'app-mis-inversiones',
  standalone: true,
  imports: [Spinner, RouterLink, TarjetaPozo],
  templateUrl: './mis-inversiones.html',
  styleUrl: './mis-inversiones.css',
})
export class MisInversiones implements OnInit {
  private readonly inversionesSvc = inject(InversionesService);

  readonly inversiones = signal<MiInversion[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  /** Reintenta el pedido tras un error (boton "Reintentar"). */
  reintentar(): void {
    this.cargar();
  }

  /** Monto formateado en pesos, sin decimales. */
  formatoMonto(monto: number): string {
    return monto.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    });
  }

  /** Fecha formateada corta. */
  formatoFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-AR');
  }

  private cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.inversionesSvc.misInversiones().subscribe({
      next: (inversiones) => {
        this.inversiones.set(inversiones);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.error ?? 'No se pudo cargar tu portafolio. Revisa tu conexion.');
        this.cargando.set(false);
      },
    });
  }
}
