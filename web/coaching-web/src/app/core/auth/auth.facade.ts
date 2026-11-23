import { computed, Injectable, inject } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, finalize, Observable, shareReplay, take } from 'rxjs';
import { AuthSession, isSessionExpired, LoginRequest } from './auth.models';
import { AuthActions } from './store/auth.actions';
import {
  selectError,
  selectGeneration,
  selectLoginLoading,
  selectRefreshing,
  selectSession,
} from './store/auth.reducer';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private refreshRequest?: Observable<AuthSession>;

  readonly session = this.store.selectSignal(selectSession);
  readonly loginLoading = this.store.selectSignal(selectLoginLoading);
  readonly refreshing = this.store.selectSignal(selectRefreshing);
  readonly generation = this.store.selectSignal(selectGeneration);
  readonly error = this.store.selectSignal(selectError);
  readonly isAuthenticated = computed(() => {
    const session = this.session();
    return session !== null && !isSessionExpired(session);
  });

  hydrate(): void {
    this.store.dispatch(AuthActions.hydrate());
  }

  login(request: LoginRequest, returnUrl: string): void {
    this.store.dispatch(AuthActions.login({ request, returnUrl }));
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }

  clearSession(): void {
    this.store.dispatch(AuthActions.clearSession());
  }

  accessToken(): string | null {
    const session = this.session();
    return session === null || isSessionExpired(session) ? null : session.accessToken;
  }

  refresh(): Observable<AuthSession> {
    if (!this.refreshRequest) {
      this.refreshRequest = new Observable<AuthSession>((subscriber) => {
        const generation = this.generation();
        const actionSubscription = this.actions$.pipe(
          ofType(
            AuthActions.refreshSuccess,
            AuthActions.refreshFailure,
            AuthActions.login,
            AuthActions.logout,
            AuthActions.clearSession,
          ),
          filter((action) => !('generation' in action) || action.generation === generation),
          take(1),
        ).subscribe((action) => {
          if ('session' in action) {
            subscriber.next(action.session);
            subscriber.complete();
            return;
          }

          subscriber.error(new Error('error' in action ? action.error : 'The sign-in session was cleared.'));
        });

        this.store.dispatch(AuthActions.refresh({ generation }));
        return () => actionSubscription.unsubscribe();
      }).pipe(
        finalize(() => { this.refreshRequest = undefined; }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }

    return this.refreshRequest;
  }
}
