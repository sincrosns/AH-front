import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Pozo, PozosService } from '../../services/pozos.service';
import { Spinner } from '../spinner/spinner';

@Component({
  selector: 'app-calculadora',
  standalone: true,
  imports: [Spinner, RouterLink],
  templateUrl: './calculadora.html',
  styleUrl: './calculadora.css',
})
export class Calculadora implements OnInit {
  private readonly pozosSvc = inject(PozosService);

  readonly pozosAbiertos = signal<Pozo[]>([]);
  readonly cargandoPozos = signal(true);
  readonly errorPozos = signal<string | null>(null);

  readonly pozoSeleccionadoId = signal<string | null>(null);
  readonly montoInvertir = signal(0);
  readonly montoObjetivo = signal(0);
  readonly precioVentaEstimado = signal(0);

  /**
   * Ganancia estimada para el monto a invertir, si el auto se vende al
   * precio estimado. Misma formula que gananciaEstimada() en pozo-detalle.ts:
   * se reparte proporcional al monto sobre el objetivo total del pozo.
   * Null si todavia no hay un objetivo cargado.
   */
  readonly gananciaEstimada = computed<number | null>(() => {
    const objetivo = this.montoObjetivo();
    if (objetivo <= 0) return null;

    const monto = this.montoInvertir();
    if (!monto || monto <= 0) return 0;

    const gananciaTotalEstimada = this.precioVentaEstimado() - objetivo;
    return gananciaTotalEstimada * (monto / objetivo);
  });

  /** Porcentaje de retorno sobre el monto invertido (0-100). Null si no aplica. */
  readonly porcentajeRetorno = computed<number | null>(() => {
    const ganancia = this.gananciaEstimada();
    const monto = this.montoInvertir();
    if (ganancia === null || !monto || monto <= 0) return null;

    return (ganancia / monto) * 100;
  });

  ngOnInit(): void {
    this.cargarPozosAbiertos();
  }

  reintentar(): void {
    this.cargarPozosAbiertos();
  }

  /** Al elegir un pozo real del listado, autocompleta objetivo y precio de venta. */
  seleccionarPozo(id: string): void {
    if (!id) {
      this.pozoSeleccionadoId.set(null);
      return;
    }

    const pozo = this.pozosAbiertos().find((p) => p.id === id);
    if (!pozo) return;

    this.pozoSeleccionadoId.set(id);
    this.montoObjetivo.set(pozo.montoObjetivo);
    this.precioVentaEstimado.set(pozo.precioVentaEstimado ?? 0);
  }

  onMontoInvertirChange(valor: string): void {
    this.montoInvertir.set(Number(valor) || 0);
  }

  onMontoObjetivoChange(valor: string): void {
    this.montoObjetivo.set(Number(valor) || 0);
  }

  onPrecioVentaChange(valor: string): void {
    this.precioVentaEstimado.set(Number(valor) || 0);
  }

  /** Monto formateado en pesos, sin decimales. */
  formatoMonto(monto: number): string {
    return monto.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    });
  }

  /** Porcentaje formateado (recibe un valor 0-100). */
  formatoPorcentaje(valor: number): string {
    return `${valor.toFixed(1)}%`;
  }

  private cargarPozosAbiertos(): void {
    this.cargandoPozos.set(true);
    this.errorPozos.set(null);

    this.pozosSvc.listar().subscribe({
      next: (pozos) => {
        const abiertos = pozos.filter((p) => p.estado === 'Abierto');
        this.pozosAbiertos.set(abiertos);
        this.cargandoPozos.set(false);

        if (abiertos.length > 0) {
          this.seleccionarPozo(abiertos[0].id);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.errorPozos.set(err.error?.error ?? 'No se pudieron cargar los pozos. Revisa tu conexion.');
        this.cargandoPozos.set(false);
      },
    });
  }
}
