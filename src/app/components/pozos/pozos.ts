import { Component, ElementRef, HostListener, OnInit, ViewChild, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Pozo, PozosService } from '../../services/pozos.service';
import { Spinner } from '../spinner/spinner';
import { TarjetaPozo } from '../tarjeta-pozo/tarjeta-pozo';

@Component({
  selector: 'app-pozos',
  standalone: true,
  imports: [Spinner, ReactiveFormsModule, TarjetaPozo],
  templateUrl: './pozos.html',
  styleUrl: './pozos.css',
})
export class Pozos implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly pozosSvc = inject(PozosService);
  readonly authSvc = inject(AuthService);

  readonly pozos = signal<Pozo[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly pozoForm = this.fb.nonNullable.group({
    titulo: ['', [Validators.required]],
    autoDescripcion: ['', [Validators.required]],
    montoObjetivo: [0, [Validators.required, Validators.min(1)]],
    imagenUrl: [''],
    precioVentaEstimado: [0],
  });

  readonly formVisible = signal(false);
  readonly formEnviando = signal(false);
  readonly formError = signal<string | null>(null);
  readonly formExito = signal(false);
  readonly pozoEditandoId = signal<string | null>(null);

  readonly eliminarObjetivo = signal<Pozo | null>(null);
  readonly eliminarEnviando = signal(false);
  readonly eliminarError = signal<string | null>(null);

  @ViewChild('pozoFormModal') private pozoFormModalRef?: ElementRef<HTMLElement>;
  @ViewChild('confirmEliminarModal') private confirmEliminarModalRef?: ElementRef<HTMLElement>;
  private elementoConFocoPrevio: HTMLElement | null = null;

  ngOnInit(): void {
    this.cargarPozos();
  }

  /** Reintenta el pedido tras un error (boton "Reintentar"). */
  reintentar(): void {
    this.cargarPozos();
  }

  /** Monto formateado en pesos, sin decimales. */
  formatoMonto(monto: number): string {
    return monto.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    });
  }

  /** Abre el modal para crear un pozo nuevo. */
  abrirCrear(): void {
    this.pozoEditandoId.set(null);
    this.pozoForm.reset({ titulo: '', autoDescripcion: '', montoObjetivo: 0, imagenUrl: '', precioVentaEstimado: 0 });
    this.abrirForm();
  }

  /** Abre el modal para editar un pozo existente, precargado. */
  abrirEditar(pozo: Pozo): void {
    this.pozoEditandoId.set(pozo.id);
    this.pozoForm.setValue({
      titulo: pozo.titulo,
      autoDescripcion: pozo.autoDescripcion,
      montoObjetivo: pozo.montoObjetivo,
      imagenUrl: pozo.imagenUrl ?? '',
      precioVentaEstimado: pozo.precioVentaEstimado ?? 0,
    });
    this.abrirForm();
  }

  cerrarForm(): void {
    this.formVisible.set(false);
    this.elementoConFocoPrevio?.focus();
    this.elementoConFocoPrevio = null;
  }

  guardarPozo(): void {
    if (this.pozoForm.invalid || this.formEnviando()) {
      this.pozoForm.markAllAsTouched();
      return;
    }

    this.formEnviando.set(true);
    this.formError.set(null);
    this.formExito.set(false);

    const valores = this.pozoForm.getRawValue();
    const datos = {
      ...valores,
      precioVentaEstimado: valores.precioVentaEstimado > 0 ? valores.precioVentaEstimado : null,
    };
    const editId = this.pozoEditandoId();
    const obs = editId ? this.pozosSvc.actualizar(editId, datos) : this.pozosSvc.crear(datos);

    obs.subscribe({
      next: (pozo) => {
        if (editId) {
          this.pozos.update((lista) => lista.map((p) => (p.id === pozo.id ? pozo : p)));
        } else {
          this.pozos.update((lista) => [pozo, ...lista]);
        }
        this.formEnviando.set(false);
        this.formExito.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.formError.set(err.error?.error ?? 'No se pudo guardar el pozo.');
        this.formEnviando.set(false);
      },
    });
  }

  /** Abre el modal de confirmacion para borrar un pozo. */
  eliminarPozo(pozo: Pozo): void {
    if (this.eliminarEnviando()) {
      return;
    }

    this.elementoConFocoPrevio = document.activeElement as HTMLElement | null;
    this.eliminarError.set(null);
    this.eliminarObjetivo.set(pozo);

    setTimeout(() => {
      this.obtenerFocosDelModal(this.confirmEliminarModalRef)[0]?.focus();
    });
  }

  cancelarEliminarPozo(): void {
    this.eliminarObjetivo.set(null);
    this.elementoConFocoPrevio?.focus();
    this.elementoConFocoPrevio = null;
  }

  confirmarEliminarPozo(): void {
    const pozo = this.eliminarObjetivo();
    if (!pozo) {
      return;
    }

    this.eliminarObjetivo.set(null);
    this.eliminarEnviando.set(true);
    this.eliminarError.set(null);

    this.pozosSvc.eliminar(pozo.id).subscribe({
      next: () => {
        this.pozos.update((lista) => lista.filter((p) => p.id !== pozo.id));
        this.eliminarEnviando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.eliminarError.set(err.error?.error ?? 'No se pudo eliminar el pozo.');
        this.eliminarEnviando.set(false);
      },
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.eliminarObjetivo()) {
      this.cancelarEliminarPozo();
    } else if (this.formVisible()) {
      this.cerrarForm();
    }
  }

  onFormModalKeydown(event: KeyboardEvent): void {
    this.atraparFoco(event, this.pozoFormModalRef);
  }

  onEliminarModalKeydown(event: KeyboardEvent): void {
    this.atraparFoco(event, this.confirmEliminarModalRef);
  }

  private abrirForm(): void {
    this.elementoConFocoPrevio = document.activeElement as HTMLElement | null;
    this.formError.set(null);
    this.formExito.set(false);
    this.formVisible.set(true);

    setTimeout(() => {
      this.obtenerFocosDelModal(this.pozoFormModalRef)[0]?.focus();
    });
  }

  private atraparFoco(event: KeyboardEvent, modalRef?: ElementRef<HTMLElement>): void {
    if (event.key !== 'Tab') {
      return;
    }
    const focosables = this.obtenerFocosDelModal(modalRef);
    if (focosables.length === 0) {
      return;
    }
    const primero = focosables[0];
    const ultimo = focosables[focosables.length - 1];

    if (event.shiftKey && document.activeElement === primero) {
      event.preventDefault();
      ultimo.focus();
    } else if (!event.shiftKey && document.activeElement === ultimo) {
      event.preventDefault();
      primero.focus();
    }
  }

  private obtenerFocosDelModal(modalRef?: ElementRef<HTMLElement>): HTMLElement[] {
    const modal = modalRef?.nativeElement;
    if (!modal) {
      return [];
    }
    return Array.from(
      modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    );
  }

  private cargarPozos(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.pozosSvc.listar().subscribe({
      next: (pozos) => {
        this.pozos.set(pozos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.error ?? 'No se pudieron cargar los pozos. Revisa tu conexion.');
        this.cargando.set(false);
      },
    });
  }
}
