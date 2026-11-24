import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthFacade } from './auth.facade';
import { I18nService } from '../i18n/i18n.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthFacade);
  const i18n = inject(I18nService);
  const localizedRequest = request.url.startsWith('/api/')
    ? request.clone({ setHeaders: { 'Accept-Language': i18n.locale() } })
    : request;
  const isApiRequest = localizedRequest.url.startsWith('/api/');
  const isAuthenticationRequest = localizedRequest.url.startsWith('/api/auth/');
  const canRefresh = isApiRequest && !isAuthenticationRequest && !request.headers.has('Authorization');

  if (!canRefresh) {
    return next(localizedRequest);
  }

  const accessToken = auth.accessToken();
  const authorizedRequest = accessToken
    ? localizedRequest.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : localizedRequest;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      return auth.refresh().pipe(
        switchMap((session) => next(localizedRequest.clone({
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
