import { TestBed } from '@angular/core/testing';
import { ConnectionErrorService } from './connection-error.service';

describe('ConnectionErrorService', () => {
  let service: ConnectionErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConnectionErrorService);
  });

  it('mostrar() deja el mensaje() con el valor pasado', () => {
    service.mostrar('No se pudo conectar con el servidor.');

    expect(service.mensaje()).toBe('No se pudo conectar con el servidor.');
  });

  it('limpiar() vuelve el mensaje() a null', () => {
    service.mostrar('algun error');

    service.limpiar();

    expect(service.mensaje()).toBeNull();
  });
});
