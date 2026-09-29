import { Component, computed, ElementRef, HostListener, inject, OnInit, signal, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService, Tema, Usuario } from '../../services/auth.service';
import { UsuariosService } from '../../services/usuarios.service';
import { ThemeService } from '../../services/theme.service';
import { Spinner } from '../spinner/spinner';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, Spinner],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css',
})
export class Configuracion implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authSvc = inject(AuthService);
  private readonly usuariosSvc = inject(UsuariosService);
  private readonly themeSvc = inject(ThemeService);

  readonly usuario = signal<Usuario | null>(null);

  readonly iniciales = computed(() => {
    const u = this.usuario();
    if (!u) {
      return '';
    }
    const n = u.nombre?.trim().charAt(0) ?? '';
    const a = u.apellido?.trim().charAt(0) ?? '';
    return (n + a).toUpperCase();
  });

  readonly perfilForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    apellido: ['', [Validators.required]],
    telefono: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    passwordActual: ['', [Validators.required]],
    passwordNueva: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly perfilEnviando = signal(false);
  readonly perfilError = signal<string | null>(null);
  readonly perfilExito = signal(false);

  readonly passwordEnviando = signal(false);
  readonly passwordError = signal<string | null>(null);
  readonly passwordExito = signal(false);

  readonly temaEnviando = signal(false);
  readonly temaError = signal<string | null>(null);
  readonly temaExito = signal(false);

  readonly notifEnviando = signal(false);
  readonly notifError = signal<string | null>(null);
  readonly notifExito = signal(false);

  readonly eliminarEnviando = signal(false);
  readonly eliminarError = signal<string | null>(null);
  readonly confirmEliminarVisible = signal(false);

  @ViewChild('confirmEliminarModal') private confirmEliminarModalRef?: ElementRef<HTMLElement>;
  private elementoConFocoPrevio: HTMLElement | null = null;

  readonly meCargando = signal(true);
  readonly meError = signal<string | null>(null);

  ngOnInit(): void {
    this.usuariosSvc.obtenerMe().subscribe({
      next: (usuario) => {
        this.usuario.set(usuario);
        this.authSvc.actualizarUsuarioActual(usuario);
        this.perfilForm.setValue({
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          telefono: usuario.telefono,
          email: usuario.email,
        });
        this.meCargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.meError.set(err.error?.error ?? 'No se pudo cargar tu cuenta.');
        this.meCargando.set(false);
      },
    });
  }

  guardarPerfil(): void {
    if (this.perfilForm.invalid || this.perfilEnviando()) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    this.perfilEnviando.set(true);
    this.perfilError.set(null);
    this.perfilExito.set(false);

    this.usuariosSvc.actualizarMe(this.perfilForm.getRawValue()).subscribe({
      next: (usuario) => {
        this.usuario.set(usuario);
        this.authSvc.actualizarUsuarioActual(usuario);
        this.perfilEnviando.set(false);
        this.perfilExito.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.perfilError.set(err.error?.error ?? 'No se pudo actualizar el perfil.');
        this.perfilEnviando.set(false);
      },
    });
  }

  cambiarPassword(): void {
    if (this.passwordForm.invalid || this.passwordEnviando()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.passwordEnviando.set(true);
    this.passwordError.set(null);
    this.passwordExito.set(false);

    this.usuariosSvc.cambiarPassword(this.passwordForm.getRawValue()).subscribe({
      next: () => {
        this.passwordEnviando.set(false);
        this.passwordExito.set(true);
        this.passwordForm.reset({ passwordActual: '', passwordNueva: '' });
      },
      error: (err: HttpErrorResponse) => {
        this.passwordError.set(err.error?.error ?? 'No se pudo cambiar la contraseña.');
        this.passwordEnviando.set(false);
      },
    });
  }

  cambiarTema(tema: Tema): void {
    if (this.temaEnviando() || this.usuario()?.tema === tema) {
      return;
    }

    this.temaEnviando.set(true);
    this.temaError.set(null);
    this.temaExito.set(false);

    this.usuariosSvc.cambiarTema(tema).subscribe({
      next: ({ tema }) => {
        const actual = this.usuario();
        if (actual) {
          const actualizado = { ...actual, tema };
          this.usuario.set(actualizado);
          this.authSvc.actualizarUsuarioActual(actualizado);
        }
        this.themeSvc.set(tema);
        this.temaEnviando.set(false);
        this.temaExito.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.temaError.set(err.error?.error ?? 'No se pudo cambiar el tema.');
        this.temaEnviando.set(false);
      },
    });
  }

  cambiarNotificaciones(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const valor = checkbox.checked;

    if (this.notifEnviando()) {
      checkbox.checked = !valor;
      return;
    }

    this.notifEnviando.set(true);
    this.notifError.set(null);
    this.notifExito.set(false);

    this.usuariosSvc.cambiarNotificaciones(valor).subscribe({
      next: ({ notificacionesEmail }) => {
        const actual = this.usuario();
        if (actual) {
          const actualizado = { ...actual, notificacionesEmail };
          this.usuario.set(actualizado);
          this.authSvc.actualizarUsuarioActual(actualizado);
        }
        this.notifEnviando.set(false);
        this.notifExito.set(true);
      },
      error: (err: HttpErrorResponse) => {
        checkbox.checked = !valor;
        this.notifError.set(err.error?.error ?? 'No se pudo actualizar la preferencia.');
        this.notifEnviando.set(false);
      },
    });
  }

  eliminarCuenta(): void {
    if (this.eliminarEnviando()) {
      return;
    }

    this.elementoConFocoPrevio = document.activeElement as HTMLElement | null;
    this.confirmEliminarVisible.set(true);

    setTimeout(() => {
      this.obtenerFocosDelModal()[0]?.focus();
    });
  }

  cancelarEliminarCuenta(): void {
    this.confirmEliminarVisible.set(false);
    this.elementoConFocoPrevio?.focus();
    this.elementoConFocoPrevio = null;
  }

  confirmarEliminarCuenta(): void {
    this.confirmEliminarVisible.set(false);
    this.eliminarEnviando.set(true);
    this.eliminarError.set(null);

    this.usuariosSvc.eliminarMe().subscribe({
      next: () => {
        this.eliminarEnviando.set(false);
        this.authSvc.logout();
      },
      error: (err: HttpErrorResponse) => {
        this.eliminarError.set(err.error?.error ?? 'No se pudo eliminar la cuenta.');
        this.eliminarEnviando.set(false);
      },
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirmEliminarVisible()) {
      this.cancelarEliminarCuenta();
    }
  }

  onModalKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }
    const focosables = this.obtenerFocosDelModal();
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

  private obtenerFocosDelModal(): HTMLElement[] {
    const modal = this.confirmEliminarModalRef?.nativeElement;
    if (!modal) {
      return [];
    }
    return Array.from(
      modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    );
  }
}
