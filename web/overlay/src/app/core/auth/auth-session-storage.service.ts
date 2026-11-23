import { Injectable } from '@angular/core';
import { AuthSession, isAuthSession, isSessionExpired } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthSessionStorage {
  private readonly storageKey = 'coaching.auth.session';

  read(): AuthSession | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }

    const serialized = sessionStorage.getItem(this.storageKey);
    if (!serialized) {
      return null;
    }

    try {
      const session: unknown = JSON.parse(serialized);
      if (isAuthSession(session) && !isSessionExpired(session)) {
        return session;
      }
    } catch {
      // Treat malformed browser storage as an unauthenticated session.
    }

    this.clear();
    return null;
  }

  save(session: AuthSession): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.storageKey, JSON.stringify(session));
    }
  }

  clear(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(this.storageKey);
    }
  }
}
