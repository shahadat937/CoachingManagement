import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: grid; min-height: 100%; place-items: center; padding: 2rem; }
    form { display: grid; gap: 1rem; width: min(100%, 24rem); }
    label { display: grid; gap: .35rem; }
    input, button { font: inherit; padding: .65rem; }
    .error { color: #b42318; }
  `,
  template: `
    <form (ngSubmit)="submit()" #loginForm="ngForm" novalidate>
      <h1>Sign in</h1>
      <label>
        Email
        <input name="email" type="email" autocomplete="email" required [(ngModel)]="email" [disabled]="loading()" />
      </label>
      <label>
        Password
        <input name="password" type="password" autocomplete="current-password" required [(ngModel)]="password" [disabled]="loading()" />
      </label>
      @if (error(); as message) {
        <p class="error" role="alert">{{ message }}</p>
      }
      <button type="submit" [disabled]="loading() || loginForm.invalid">
        {{ loading() ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    const email = this.email.trim();
    if (!email || !this.password) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.login({ email, password: this.password }).subscribe({
      next: () => void this.router.navigateByUrl(this.returnUrl()),
      error: (response: HttpErrorResponse) => {
        this.error.set(response.status === 401
          ? 'The email address or password is incorrect.'
          : 'Sign-in is unavailable. Please try again.');
        this.loading.set(false);
      },
    });
  }

  private returnUrl(): string {
    const candidate = this.route.snapshot.queryParamMap.get('returnUrl');
    return candidate?.startsWith('/') && !candidate.startsWith('//') ? candidate : '/attendance';
  }
}
