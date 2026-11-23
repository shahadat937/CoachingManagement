import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthFacade } from './auth.facade';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthFacade);
  const isApiRequest = request.url.startsWith('/api/');
  const isAuthenticationRequest = request.url.startsWith('/api/auth/');
  const canRefresh = isApiRequest && !isAuthenticationRequest && !request.headers.has('Authorization');

  if (!canRefresh) {
    return next(request);
  }

  const accessToken = auth.accessToken();
  const authorizedRequest = accessToken
    ? request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : request;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      return auth.refresh().pipe(
        switchMap((session) => next(request.clone({
          setHeaders: { Authorization: `Bearer ${session.accessToken}` },
        }))),
        catchError((refreshError: unknown) => {
          auth.clearSession();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
