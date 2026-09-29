import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

const TEMA_KEY = 'ah_tema';

describe('ThemeService', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-tema');
  });

  it('se crea con "claro" cuando no hay nada guardado en localStorage', () => {
    localStorage.removeItem(TEMA_KEY);

    const service = TestBed.inject(ThemeService);

    expect(service.tema()).toBe('claro');
    expect(document.documentElement.getAttribute('data-tema')).toBe('claro');
  });

  it('lee el tema guardado en localStorage al construirse', () => {
    localStorage.setItem(TEMA_KEY, 'oscuro');

    const service = TestBed.inject(ThemeService);

    expect(service.tema()).toBe('oscuro');
    expect(document.documentElement.getAttribute('data-tema')).toBe('oscuro');
  });

  it('set() persiste el tema en localStorage bajo la clave ah_tema', () => {
    const service = TestBed.inject(ThemeService);

    service.set('oscuro');

    expect(localStorage.getItem(TEMA_KEY)).toBe('oscuro');
  });

  it('set() aplica el atributo data-tema en document.documentElement', () => {
    const service = TestBed.inject(ThemeService);

    service.set('oscuro');
    expect(document.documentElement.getAttribute('data-tema')).toBe('oscuro');

    service.set('claro');
    expect(document.documentElement.getAttribute('data-tema')).toBe('claro');
  });

  it('set() actualiza la signal tema', () => {
    const service = TestBed.inject(ThemeService);

    service.set('oscuro');

    expect(service.tema()).toBe('oscuro');
  });
});
