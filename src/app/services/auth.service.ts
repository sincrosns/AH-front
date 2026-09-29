import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ThemeService } from './theme.service';

export type Tema = 'claro' | 'oscuro';

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  tema: Tema;
  fechaAlta: string;
  ultimoAcceso: string | null;
  notificacionesEmail: boolean;
}

export interface DatosRegistro {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  password: string;
}

interface RespuestaLogin {
  token: string;
  usuario: Usuario;
}

export const TOKEN_KEY = 'ah_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly themeSvc = inject(ThemeService);

  readonly usuarioActual = signal<Usuario | null>(null);
  readonly estaLogueado = computed(() => !!this.usuarioActual());
  /** True mientras se restaura la sesion (GET /usuarios/me) al arrancar con token guardado. */
  readonly verificandoSesion = signal<boolean>(!!this.getToken());

  constructor() {
    // Se difiere al siguiente microtask (no se llama directo desde el constructor):
    // el interceptor de HttpClient (authInterceptor) hace inject(AuthService), y si
    // el HTTP se dispara mientras este mismo constructor todavia esta corriendo,
    // Angular no term de registrar el servicio en el injector y tira
    // NG0200 (Circular dependency detected for AuthService). Esto rompia SIEMPRE
    // que habia un token guardado al arrancar la app (login persistido / recarga):
    // el error caia en el catch de cargarUsuarioActual(), que limpiaba la sesion y
    // mandaba de vuelta a /login aunque el back respondiera bien.
    if (this.getToken()) {
      queueMicrotask(() => this.cargarUsuarioActual());
    }
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(email: string, password: string) {
    return this.http
      .post<RespuestaLogin>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem(TOKEN_KEY, res.token);
          this.usuarioActual.set(res.usuario);
          this.themeSvc.set(res.usuario.tema);
        }),
      );
  }

  registrar(datos: DatosRegistro) {
    return this.http.post<Usuario>(`${environment.apiUrl}/auth/register`, datos);
  }

  /** Trae el usuario autenticado con el token guardado, para restaurar sesion al recargar. */
  private cargarUsuarioActual(): void {
    this.http.get<Usuario>(`${environment.apiUrl}/usuarios/me`).subscribe({
      next: (usuario) => {
        this.usuarioActual.set(usuario);
        this.themeSvc.set(usuario.tema);
        this.verificandoSesion.set(false);
      },
      error: () => {
        this.limpiarSesion();
        this.verificandoSesion.set(false);
      },
    });
  }

  actualizarUsuarioActual(usuario: Usuario): void {
    this.usuarioActual.set(usuario);
  }

  private limpiarSesion(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.usuarioActual.set(null);
  }

  logout(): void {
    this.limpiarSesion();
    this.router.navigate(['/']);
  }

  /** Limpia la sesion y redirige a /login cuando el back rechaza el token por vencido o invalido. */
  sesionExpirada(): void {
    this.limpiarSesion();
    this.router.navigate(['/login']);
  }
}
