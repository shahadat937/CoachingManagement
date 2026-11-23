import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthFacade } from '../../../core/auth/auth.facade';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; min-height: 100dvh; }
    * { box-sizing: border-box; }
    .page { background: #f4f6fb; display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(24rem, .92fr); min-height: 100dvh; }
    .story { background: linear-gradient(145deg, #10213d 0%, #18355f 57%, #344d82 100%); color: #fff; display: flex; flex-direction: column; overflow: hidden; padding: clamp(2rem, 5vw, 5rem); position: relative; }
    .story::before, .story::after { border: 1px solid rgba(169, 212, 255, .13); border-radius: 50%; content: ''; position: absolute; } .story::before { height: 33rem; left: -15rem; top: 20%; width: 33rem; } .story::after { height: 24rem; right: -12rem; top: -9rem; width: 24rem; }
    .brand { align-items: center; display: flex; gap: .8rem; position: relative; text-decoration: none; z-index: 1; } .brand-mark { align-items: center; background: linear-gradient(135deg, #827cff, #43c7ef); border-radius: .9rem; display: inline-flex; font-size: 1.1rem; font-weight: 850; height: 2.65rem; justify-content: center; letter-spacing: -.08em; width: 2.65rem; } .brand strong { font-size: 1rem; letter-spacing: -.02em; } .brand small { color: #b5c4df; display: block; font-size: .69rem; letter-spacing: .07em; margin-top: .12rem; text-transform: uppercase; }
    .story-copy { margin: auto 0; max-width: 35rem; position: relative; z-index: 1; } .kicker { color: #85dbed; font-size: .74rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; } .story h1 { font-size: clamp(2.15rem, 4.3vw, 4.35rem); letter-spacing: -.065em; line-height: 1.01; margin: .9rem 0 1.2rem; } .story-copy > p { color: #c3d0e6; font-size: 1rem; line-height: 1.65; max-width: 31rem; }
    .proof { display: grid; gap: .7rem; grid-template-columns: repeat(3, 1fr); margin-top: 2.4rem; max-width: 31rem; } .proof div { border-left: 1px solid rgba(200, 222, 249, .3); padding-left: .7rem; } .proof strong { display: block; font-size: 1.2rem; letter-spacing: -.04em; } .proof small { color: #b6c5df; font-size: .68rem; line-height: 1.3; }
    .quote { border-top: 1px solid rgba(200, 222, 249, .16); color: #c0cde2; font-size: .78rem; line-height: 1.5; margin-top: auto; padding-top: 1.2rem; position: relative; z-index: 1; } .quote strong { color: #f0f5ff; display: block; font-size: .72rem; margin-top: .45rem; }
    .login-side { align-items: center; display: flex; justify-content: center; padding: clamp(1.2rem, 5vw, 4rem); } .card { max-width: 25rem; width: 100%; } .mobile-brand { display: none; }
    .card h2 { color: #182b47; font-size: 1.8rem; letter-spacing: -.045em; margin: 0; } .intro { color: #74839b; font-size: .88rem; line-height: 1.55; margin: .6rem 0 1.8rem; }
    form { display: grid; gap: 1rem; } label { color: #44536b; display: grid; font-size: .76rem; font-weight: 750; gap: .45rem; } .field { align-items: center; background: #fff; border: 1px solid #dfe5f0; border-radius: .72rem; display: flex; gap: .55rem; padding: .05rem .75rem; transition: border-color .18s ease, box-shadow .18s ease; } .field:focus-within { border-color: #7670ee; box-shadow: 0 0 0 3px rgba(101, 91, 233, .12); } .field svg { fill: none; flex: 0 0 auto; height: 1rem; stroke: #8998ae; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; width: 1rem; } input { background: transparent; border: 0; color: #263b59; font: inherit; font-size: .9rem; outline: 0; padding: .82rem 0; width: 100%; } input::placeholder { color: #a7b2c3; } .password-toggle { background: transparent; border: 0; color: #71819a; cursor: pointer; font-size: .7rem; font-weight: 750; padding: .3rem 0; }
    .error { background: #fff1f2; border: 1px solid #ffd9dd; border-radius: .65rem; color: #b43d4c; font-size: .76rem; line-height: 1.45; margin: 0; padding: .7rem .8rem; } .submit { align-items: center; background: #6159e9; border: 0; border-radius: .72rem; box-shadow: 0 11px 22px rgba(91, 80, 224, .25); color: #fff; cursor: pointer; display: flex; font: inherit; font-size: .86rem; font-weight: 800; justify-content: center; min-height: 3rem; transition: transform .18s ease, background .18s ease; } .submit:hover:not(:disabled) { background: #554ee0; transform: translateY(-1px); } .submit:disabled { cursor: not-allowed; opacity: .65; }
    .security { align-items: center; color: #8290a5; display: flex; font-size: .7rem; gap: .4rem; line-height: 1.45; margin: 1.2rem 0 0; } .security svg { fill: none; height: .85rem; stroke: #18a87d; stroke-width: 2; width: .85rem; }
    @media (max-width: 840px) { .page { grid-template-columns: 1fr; } .story { display: none; } .login-side { background: radial-gradient(circle at top right, #e8ecff, transparent 38%), #f7f8fc; min-height: 100dvh; } .mobile-brand { align-items: center; color: #263954; display: flex; font-size: .9rem; font-weight: 800; gap: .55rem; margin-bottom: 3rem; } .mobile-brand span { align-items: center; background: linear-gradient(135deg, #827cff, #43c7ef); border-radius: .65rem; color: #fff; display: inline-flex; font-size: .78rem; height: 2rem; justify-content: center; width: 2rem; } } @media (max-width: 420px) { .login-side { padding: 1.25rem; } .proof { gap: .35rem; } }
  `,
  template: `
    <main class="page">
      <section class="story" aria-label="Coaching Hub introduction">
        <a class="brand" href="/login"><span class="brand-mark">CH</span><span><strong>Coaching Hub</strong><small>Management portal</small></span></a>
        <div class="story-copy">
          <span class="kicker">One clear coaching day</span>
          <h1>Run every class with calm, useful clarity.</h1>
          <p>Bring students, attendance, academic work and finance together in a workspace built for the pace of a busy coaching centre.</p>
          <div class="proof"><div><strong>1,248</strong><small>active learners</small></div><div><strong>93.4%</strong><small>attendance today</small></div><div><strong>12</strong><small>class levels</small></div></div>
        </div>
        <p class="quote">“The right view of the day makes every follow-up feel lighter.”<strong>Coaching Hub operations</strong></p>
      </section>

      <section class="login-side">
        <div class="card">
          <div class="mobile-brand"><span>CH</span>Coaching Hub</div>
          <h2>Welcome back</h2>
          <p class="intro">Sign in to open your secure, role-aware coaching workspace.</p>
          <form (ngSubmit)="submit()" #loginForm="ngForm" novalidate>
            <label>Email address
              <span class="field"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg><input name="email" type="email" autocomplete="email" placeholder="you@coaching.local" required [(ngModel)]="email" [disabled]="loading()" /></span>
            </label>
            <label>Password
              <span class="field"><svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg><input name="password" [type]="showPassword() ? 'text' : 'password'" autocomplete="current-password" placeholder="Enter your password" required [(ngModel)]="password" [disabled]="loading()" /><button class="password-toggle" type="button" (click)="showPassword.set(!showPassword())">{{ showPassword() ? 'Hide' : 'Show' }}</button></span>
            </label>
            @if (error(); as message) { <p class="error" role="alert">{{ message }}</p> }
            <button class="submit" type="submit" [disabled]="loading() || loginForm.invalid">{{ loading() ? 'Signing you in…' : 'Sign in to workspace' }}</button>
          </form>
          <p class="security"><svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.6 3 8.8 7 10 4-1.2 7-5.4 7-10V6z" /><path d="m9 12 2 2 4-4" /></svg>Your session uses secure access and refresh tokens.</p>
        </div>
      </section>
    </main>
  `,
})
export class LoginComponent {
  readonly auth = inject(AuthFacade);
  private readonly route = inject(ActivatedRoute);

  email = '';
  password = '';
  readonly showPassword = signal(false);
  readonly loading = this.auth.loginLoading;
  readonly error = this.auth.error;

  submit(): void {
    const email = this.email.trim();
    if (!email || !this.password) { return; }
    this.auth.login({ email, password: this.password }, this.returnUrl());
  }

  private returnUrl(): string {
    const candidate = this.route.snapshot.queryParamMap.get('returnUrl');
    return candidate?.startsWith('/') && !candidate.startsWith('//') ? candidate : '/dashboard';
  }
}
