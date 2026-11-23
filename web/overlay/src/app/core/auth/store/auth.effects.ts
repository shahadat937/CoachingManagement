import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, takeUntil, tap } from 'rxjs';
import { AuthSessionStorage } from '../auth-session-storage.service';
import { AuthService } from '../auth.service';
import { AuthActions as A } from './auth.actions';

export const hydrate$ = createEffect(
  (actions$ = inject(Actions), storage = inject(AuthSessionStorage)) =>
    actions$.pipe(
      ofType(A.hydrate),
      map(() => A.hydrateSuccess({ session: storage.read() })),
    ),
  { functional: true },
);

export const login$ = createEffect(
  (actions$ = inject(Actions), api = inject(AuthService)) =>
    actions$.pipe(
      ofType(A.login),
      exhaustMap(({ request, returnUrl }) =>
        api.login(request).pipe(
          map((session) => A.loginSuccess({ session, returnUrl })),
          catchError((error: unknown) => of(A.loginFailure({ error: loginError(error) }))),
        ),
      ),
    ),
  { functional: true },
);

export const refresh$ = createEffect(
  (actions$ = inject(Actions), api = inject(AuthService)) =>
    actions$.pipe(
      ofType(A.refresh),
      // Only one refresh request may consume the one-time refresh cookie at a time.
      exhaustMap(({ generation }) =>
        api.refresh().pipe(
          map((session) => A.refreshSuccess({ session, generation })),
          catchError((error: unknown) => of(A.refreshFailure({ error: refreshError(error), generation }))),
          takeUntil(actions$.pipe(ofType(A.login, A.logout, A.clearSession))),
        ),
      ),
    ),
  { functional: true },
);

export const logout$ = createEffect(
  (actions$ = inject(Actions), api = inject(AuthService)) =>
    actions$.pipe(
      ofType(A.logout),
      exhaustMap(() =>
        api.logout().pipe(
          map(() => A.logoutComplete()),
          // Local sign-out has already happened. A network error must not restore the session.
          catchError(() => of(A.logoutComplete())),
        ),
      ),
    ),
  { functional: true },
);

export const persistSession$ = createEffect(
  (actions$ = inject(Actions), storage = inject(AuthSessionStorage)) =>
    actions$.pipe(
      ofType(A.loginSuccess, A.refreshSuccess),
      tap(({ session }) => storage.save(session)),
    ),
  { functional: true, dispatch: false },
);

export const clearStoredSession$ = createEffect(
  (actions$ = inject(Actions), storage = inject(AuthSessionStorage)) =>
    actions$.pipe(
      ofType(A.refreshFailure, A.logout, A.clearSession),
      tap(() => storage.clear()),
    ),
  { functional: true, dispatch: false },
);

export const redirectAfterLogin$ = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(A.loginSuccess),
      tap(({ returnUrl }) => void router.navigateByUrl(returnUrl)),
    ),
  { functional: true, dispatch: false },
);

function loginError(error: unknown): string {
  return error instanceof HttpErrorResponse && error.status === 401
    ? 'The email address or password is incorrect.'
    : 'Sign-in is unavailable. Please try again.';
}

function refreshError(error: unknown): string {
  return error instanceof HttpErrorResponse && error.status === 401
    ? 'Your sign-in session has expired.'
    : 'Unable to refresh your sign-in session.';
}
