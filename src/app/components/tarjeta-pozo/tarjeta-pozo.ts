import { Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { EstadoPozo } from '../../services/pozos.service';

/**
 * Tarjeta de pozo compartida: imagen/placeholder, badge de estado, barra de
 * progreso y montos. El contenido especifico de cada pantalla (acciones,
 * datos de inversion, texto extra) se proyecta con los slots
 * tarjeta-pozo-subtitulo / tarjeta-pozo-extra / tarjeta-pozo-extra-post /
 * tarjeta-pozo-datos / tarjeta-pozo-acciones.
 */
@Component({
  selector: 'app-tarjeta-pozo',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './tarjeta-pozo.html',
  styleUrl: './tarjeta-pozo.css',
  host: {
    '[class.tarjeta-pozo--compacta]': 'compacta()',
  },
})
export class TarjetaPozo {
  readonly imagenUrl = input<string | null>(null);
  readonly imagenAlt = input('');

  /** Se marca en true si el <img> dispara error de carga (URL rota); pasa a mostrar el placeholder. */
  readonly imagenRota = signal(false);
  readonly titulo = input('');
  readonly estado = input<EstadoPozo | undefined>(undefined);

  /** true: el badge se superpone sobre la imagen (carrusel). false: va junto al titulo. */
  readonly badgeEnImagen = input(false);

  /** Variante chica, para tarjetas dentro de un carrusel angosto. */
  readonly compacta = input(false);

  /** Si hay ruta, la tarjeta entera (menos las acciones) navega al hacer click. */
  readonly link = input<unknown[] | string | null>(null);

  /** Si es false, en vez de la barra de progreso se muestra el slot tarjeta-pozo-datos. */
  readonly mostrarProgreso = input(true);
  readonly montoRecaudado = input<number | null>(null);
  readonly montoObjetivo = input<number | null>(null);

  /** Porcentaje de progreso 0-100, acotado, para la barra de la tarjeta. */
  progreso(): number {
    const objetivo = this.montoObjetivo();
    const recaudado = this.montoRecaudado();
    if (!objetivo || objetivo <= 0 || recaudado === null) {
      return 0;
    }
    const pct = (recaudado / objetivo) * 100;
    return Math.min(100, Math.max(0, Math.round(pct)));
  }

  /** Monto formateado en pesos, sin decimales. */
  formatoMonto(monto: number): string {
    return monto.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    });
  }
}
