import { Injectable, signal } from '@angular/core';
import type { Tema } from './auth.service';

const TEMA_KEY = 'ah_tema';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly tema = signal<Tema>(this.leerGuardado());

  constructor() {
    this.aplicar(this.tema());
  }

  /** Cambia el tema activo, lo persiste y lo aplica al documento. */
  set(tema: Tema): void {
    this.tema.set(tema);
    localStorage.setItem(TEMA_KEY, tema);
    this.aplicar(tema);
  }

  private leerGuardado(): Tema {
    return localStorage.getItem(TEMA_KEY) === 'oscuro' ? 'oscuro' : 'claro';
  }

  private aplicar(tema: Tema): void {
    document.documentElement.setAttribute('data-tema', tema);
  }
}
