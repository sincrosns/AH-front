import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConnectionErrorService } from './services/connection-error.service';
import { ThemeService } from './services/theme.service';
import { Header } from './components/header/header';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly connectionError = inject(ConnectionErrorService);
  // Se inyecta aca (sin usarse en el template) para que el constructor de
  // ThemeService corra al arrancar la app y aplique data-tema en <html>
  // antes de que se navegue a Configuracion.
  private readonly themeService = inject(ThemeService);
}
