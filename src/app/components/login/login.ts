import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Logo } from '../logo/logo';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, Logo],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authSvc = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly cuentaCreada = signal(!!(this.router.getCurrentNavigation()?.extras.state?.['cuentaCreada']));

  onSubmit(): void {
    if (this.form.invalid || this.enviando()) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();

    this.authSvc.login(email, password).subscribe({
      next: () => this.router.navigateByUrl('/cuenta'),
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.error ?? 'No se pudo iniciar sesion.');
        this.enviando.set(false);
      },
    });
  }
}
