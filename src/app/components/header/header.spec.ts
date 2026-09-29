import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Header } from './header';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
  });

  it('deberia crearse', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el logo de la marca', () => {
    fixture.detectChanges();
    const logo = fixture.nativeElement.querySelector('.header__brand-logo');
    expect(logo).toBeTruthy();
  });

  it('no muestra navegacion ni controles de sesion', () => {
    fixture.detectChanges();
    const texto = fixture.nativeElement.textContent ?? '';
    expect(texto).not.toContain('Salir');
    expect(texto).not.toContain('Ingresar');
    expect(fixture.nativeElement.querySelector('.header__nav')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('.header__hamburger')).toBeFalsy();
  });
});
