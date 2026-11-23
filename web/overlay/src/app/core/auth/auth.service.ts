import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, shareReplay, tap } from 'rxjs';
import { AuthSession, LoginRequest } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storageKey = 'coaching.auth.session';
  private readonly currentSession = signal<AuthSession | null>(this.readSession());
  private refreshRequest?: Observable<AuthSession>;

  readonly session = this.currentSession.asReadonly();
  readonly isAuthenticated = computed(() => {
    const session = this.currentSession();
    return session !== null && !this.isExpired(session);
  });

  login(request: LoginRequest): Observable<AuthSession> {
    return this.http.post<AuthSession>('/api/auth/login', request, { withCredentials: true }).pipe(
      tap((session) => this.saveSession(session)),
    );
  }

  refresh(): Observable<AuthSession> {
    if (!this.refreshRequest) {
      this.refreshRequest = this.http.post<AuthSession>('/api/auth/refresh', {}, { withCredentials: true }).pipe(
        tap((session) => this.saveSession(session)),
        finalize(() => { this.refreshRequest = undefined; }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }

    return this.refreshRequest;
  }

  accessToken(): string | null {
    const session = this.currentSession();
    return session === null || this.isExpired(session) ? null : session.accessToken;
  }

  logout(): void {
    this.clearSession();
    this.http.post<void>('/api/auth/logout', {}, { withCredentials: true }).subscribe({
      error: () => undefined,
    });
  }

  clearSession(): void {
    this.currentSession.set(null);
    this.removeStoredSession();
  }

  private saveSession(session: AuthSession): void {
    if (!this.isSession(session) || this.isExpired(session)) {
      this.clearSession();
      return;
    }

    this.currentSession.set(session);
    this.storeSession(session);
  }

  private readSession(): AuthSession | null {
    const serialized = this.getStoredSession();
    if (!serialized) {
      return null;
    }

    try {
      const session: unknown = JSON.parse(serialized);
      if (this.isSession(session) && !this.isExpired(session)) {
        return session;
      }

      this.removeStoredSession();
      return null;
    } catch {
      this.removeStoredSession();
      return null;
    }
  }

  private isSession(value: unknown): value is AuthSession {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const session = value as Partial<AuthSession>;
    return typeof session.accessToken === 'string'
      && typeof session.expiresAt === 'string'
      && !!session.user
      && typeof session.user.id === 'string'
      && typeof session.user.email === 'string'
      && typeof session.user.fullName === 'string'
      && typeof session.user.role === 'string';
  }

  private isExpired(session: AuthSession): boolean {
    const expiresAt = Date.parse(session.expiresAt);
    return Number.isNaN(expiresAt) || expiresAt <= Date.now();
  }

  private getStoredSession(): string | null {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(this.storageKey);
  }

  private storeSession(session: AuthSession): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.storageKey, JSON.stringify(session));
    }
  }

  private removeStoredSession(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(this.storageKey);
    }
  }
}
