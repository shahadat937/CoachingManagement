import { ChangeDetectionStrategy, Component, computed, forwardRef, inject, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthFacade } from '../auth/auth.facade';
import { APP_NAVIGATION, hasRole, NavigationIcon } from '../navigation/navigation';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, forwardRef(() => NavIconComponent)],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { --ink: #10223e; --ink-soft: #233a5e; --accent: #6058ef; --line: #e6ebf4; --canvas: #f5f7fb; display: block; min-height: 100dvh; color: #1d2b44; }
    * { box-sizing: border-box; }
    .shell { min-height: 100dvh; background: var(--canvas); }
    .sidebar { background: linear-gradient(166deg, #10213d 0%, #13294a 62%, #172c52 100%); bottom: 0; color: #eaf0ff; display: flex; flex-direction: column; left: 0; padding: 1.25rem .9rem; position: fixed; top: 0; width: 17rem; z-index: 30; }
    .brand { align-items: center; color: #fff; display: flex; gap: .75rem; margin: .25rem .4rem 2.1rem; text-decoration: none; }
    .brand-mark { align-items: center; background: linear-gradient(135deg, #7e78ff, #41c8ee); border-radius: .9rem; box-shadow: 0 10px 26px rgba(58, 197, 236, .22); display: inline-flex; font-size: 1.1rem; font-weight: 800; height: 2.55rem; justify-content: center; letter-spacing: -.08em; width: 2.55rem; }
    .brand-copy { display: grid; gap: .05rem; }
    .brand-copy strong { font-size: 1rem; letter-spacing: -.02em; }
    .brand-copy small { color: #aebbd4; font-size: .72rem; letter-spacing: .04em; text-transform: uppercase; }
    .nav-label { color: #7f91b1; font-size: .68rem; font-weight: 700; letter-spacing: .1em; margin: 0 .75rem .65rem; text-transform: uppercase; }
    nav { display: grid; gap: .28rem; overflow-y: auto; padding: 0 .15rem; }
    .nav-link { align-items: center; border: 1px solid transparent; border-radius: .75rem; color: #bdc9dd; display: grid; gap: .1rem .7rem; grid-template-columns: 1.75rem 1fr; min-height: 3.35rem; padding: .45rem .6rem; text-decoration: none; transition: background .18s ease, color .18s ease, transform .18s ease; }
    .nav-link:hover { background: rgba(255,255,255,.065); color: #fff; transform: translateX(2px); }
    .nav-link.is-active { background: linear-gradient(100deg, rgba(104, 93, 244, .8), rgba(91, 160, 242, .55)); border-color: rgba(198, 208, 255, .18); box-shadow: 0 9px 24px rgba(2, 12, 35, .18); color: #fff; }
    .nav-icon { align-items: center; display: flex; grid-row: span 2; height: 1.45rem; justify-content: center; width: 1.45rem; }
    .nav-icon svg { fill: none; height: 1.25rem; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; width: 1.25rem; }
    .nav-link strong { font-size: .9rem; font-weight: 600; line-height: 1.1; }
    .nav-link small { color: #91a2c0; font-size: .68rem; line-height: 1.1; }
    .nav-link.is-active small { color: #e7eaff; }
    .sidebar-foot { border-top: 1px solid rgba(201, 213, 239, .12); color: #94a6c5; display: grid; gap: .28rem; font-size: .76rem; margin: auto .4rem .4rem; padding-top: 1rem; }
    .sidebar-foot strong { color: #dce6fa; font-size: .8rem; }
    .content { margin-left: 17rem; min-height: 100dvh; }
    .topbar { align-items: center; background: rgba(255,255,255,.92); border-bottom: 1px solid var(--line); display: flex; gap: 1rem; height: 4.75rem; justify-content: space-between; padding: 0 clamp(1rem, 3vw, 2.6rem); position: sticky; top: 0; z-index: 20; }
    .topbar-left { align-items: center; display: flex; gap: .85rem; min-width: 0; }
    .menu-toggle { background: #eef1fb; border: 0; border-radius: .65rem; color: var(--ink); cursor: pointer; display: none; height: 2.5rem; padding: .55rem; width: 2.5rem; }
    .menu-toggle svg, .icon-button svg { fill: none; height: 1.25rem; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; width: 1.25rem; }
    .today { color: #62728e; font-size: .82rem; font-weight: 600; letter-spacing: .01em; white-space: nowrap; }
    .search { align-items: center; background: #f4f6fb; border: 1px solid transparent; border-radius: .7rem; color: #8a99b4; display: flex; gap: .55rem; max-width: 20rem; padding: .58rem .75rem; width: min(28vw, 20rem); }
    .search svg { fill: none; height: 1rem; stroke: currentColor; stroke-width: 2; width: 1rem; }
    .search input { background: transparent; border: 0; color: #253753; font: inherit; font-size: .82rem; min-width: 0; outline: 0; width: 100%; }
    .topbar-right { align-items: center; display: flex; gap: .7rem; }
    .icon-button { align-items: center; background: #f3f5fa; border: 0; border-radius: .7rem; color: #52627d; cursor: pointer; display: inline-flex; height: 2.4rem; justify-content: center; position: relative; width: 2.4rem; }
    .notification { background: #ef5f6c; border: 2px solid #fff; border-radius: 50%; height: .55rem; position: absolute; right: .47rem; top: .42rem; width: .55rem; }
    .profile-wrap { position: relative; }
    .profile-button { align-items: center; background: transparent; border: 0; border-radius: .7rem; cursor: pointer; display: flex; gap: .55rem; padding: .2rem; text-align: left; }
    .avatar { align-items: center; background: linear-gradient(135deg, #3a92e8, #7067ee); border-radius: .68rem; color: #fff; display: inline-flex; font-size: .78rem; font-weight: 800; height: 2.35rem; justify-content: center; letter-spacing: .02em; width: 2.35rem; }
    .profile-copy { display: grid; gap: .06rem; max-width: 10rem; }
    .profile-copy strong { color: #263954; font-size: .78rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .profile-copy small { color: #7c8da8; font-size: .69rem; }
    .profile-menu { background: #fff; border: 1px solid var(--line); border-radius: .8rem; box-shadow: 0 16px 35px rgba(21, 39, 72, .15); display: grid; gap: .25rem; min-width: 12rem; padding: .45rem; position: absolute; right: 0; top: calc(100% + .55rem); }
    .profile-menu button { background: transparent; border: 0; border-radius: .5rem; color: #394b68; cursor: pointer; font: inherit; font-size: .82rem; padding: .6rem .7rem; text-align: left; }
    .profile-menu button:hover { background: #f2f4fb; }
    .view { padding: clamp(1rem, 2.8vw, 2.5rem); }
    .backdrop { display: none; }
    @media (max-width: 880px) { .sidebar { box-shadow: 18px 0 40px rgba(10, 25, 52, .28); transform: translateX(-105%); transition: transform .22s ease; width: min(18rem, 82vw); } .sidebar.open { transform: translateX(0); } .content { margin-left: 0; } .menu-toggle { display: inline-flex; align-items: center; justify-content: center; } .backdrop.visible { background: rgba(12, 26, 51, .42); display: block; inset: 0; position: fixed; z-index: 25; } .search { display: none; } }
    @media (max-width: 520px) { .topbar { height: 4.25rem; padding: 0 .9rem; } .today, .profile-copy { display: none; } .view { padding: 1rem .85rem 2rem; } }
  `,
  template: `
    <div class="shell">
      <button class="backdrop" [class.visible]="mobileOpen()" type="button" aria-label="Close navigation" (click)="closeMobile()"></button>
      <aside class="sidebar" [class.open]="mobileOpen()">
        <a class="brand" routerLink="/dashboard" (click)="closeMobile()">
          <span class="brand-mark">CH</span>
          <span class="brand-copy"><strong>Coaching Hub</strong><small>Management portal</small></span>
        </a>
        <p class="nav-label">Workspace</p>
        <nav aria-label="Main navigation">
          @for (item of navigation(); track item.path) {
            <a class="nav-link" [routerLink]="item.path" routerLinkActive="is-active" (click)="closeMobile()">
              <span class="nav-icon"><app-nav-icon [icon]="item.icon" /></span>
              <strong>{{ item.label }}</strong>
              @if (item.caption) { <small>{{ item.caption }}</small> }
            </a>
          }
        </nav>
        <div class="sidebar-foot">
          <strong>{{ roleLabel() }} workspace</strong>
          <span>Protected by role policies</span>
        </div>
      </aside>

      <main class="content">
        <header class="topbar">
          <div class="topbar-left">
            <button class="menu-toggle" type="button" aria-label="Open navigation" (click)="toggleMobile()">
              <svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
            <span class="today">{{ today }}</span>
          </div>
          <label class="search" aria-label="Search workspace">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>
            <input type="search" placeholder="Search students, classes…" />
          </label>
          <div class="topbar-right">
            <button class="icon-button" type="button" aria-label="Notifications">
              <svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
              <span class="notification"></span>
            </button>
            <div class="profile-wrap">
              <button class="profile-button" type="button" (click)="profileOpen.set(!profileOpen())" [attr.aria-expanded]="profileOpen()">
                <span class="avatar">{{ initials() }}</span>
                <span class="profile-copy"><strong>{{ userName() }}</strong><small>{{ roleLabel() }}</small></span>
              </button>
              @if (profileOpen()) {
                <div class="profile-menu">
                  <button type="button" (click)="profileOpen.set(false)">My profile</button>
                  <button type="button" (click)="logout()">Sign out</button>
                </div>
              }
            </div>
          </div>
        </header>
        <section class="view"><router-outlet /></section>
      </main>
    </div>
  `,
})
export class AppShellComponent {
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);

  readonly mobileOpen = signal(false);
  readonly profileOpen = signal(false);
  readonly session = this.auth.session;
  readonly navigation = computed(() => APP_NAVIGATION.filter((item) =>
    hasRole(this.session()?.user.role, item.roles)));
  readonly userName = computed(() => this.session()?.user.fullName || 'Coaching user');
  readonly roleLabel = computed(() => this.session()?.user.role || 'Member');
  readonly initials = computed(() => this.userName().split(' ').filter(Boolean).slice(0, 2)
    .map((part) => part[0]).join('').toUpperCase() || 'CH');
  readonly today = new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long' })
    .format(new Date());

  toggleMobile(): void { this.mobileOpen.update((open) => !open); }
  closeMobile(): void { this.mobileOpen.set(false); }

  logout(): void {
    this.profileOpen.set(false);
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}

@Component({
  selector: 'app-nav-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (icon()) {
      @case ('dashboard') { <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> }
      @case ('students') { <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3" /><path d="M3.5 20c.7-3.5 2.5-5 5.5-5s4.8 1.5 5.5 5M16 5.5a2.5 2.5 0 0 1 0 5M17 15c2.2.2 3.4 1.6 4 4" /></svg> }
      @case ('academic') { <svg viewBox="0 0 24 24"><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H20v17H7.5A3.5 3.5 0 0 0 4 22zM4 5.5V22M8 6h8M8 10h6" /></svg> }
      @case ('attendance') { <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18M8 15l2 2 5-5" /></svg> }
      @case ('exams') { <svg viewBox="0 0 24 24"><path d="M7 3h10l3 3v15H4V3zM8 8h8M8 12h8M8 16h4" /><path d="m16 16 1.2 1.2L20 14.5" /></svg> }
      @case ('finance') { <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></svg> }
      @case ('devices') { <svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 6h6M10 18h4" /></svg> }
      @case ('users') { <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3" /><path d="M5 21c.8-4 3.1-6 7-6s6.2 2 7 6M18 4v5M20.5 6.5h-5" /></svg> }
    }
  `,
})
export class NavIconComponent {
  readonly icon = input.required<NavigationIcon>();
}
