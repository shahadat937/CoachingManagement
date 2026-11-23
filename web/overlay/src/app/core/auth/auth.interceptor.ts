import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const isApiRequest = request.url.startsWith('/api/');
  const isAuthenticationRequest = request.url.startsWith('/api/auth/');

  if (!isApiRequest || isAuthenticationRequest || request.headers.has('Authorization')) {
    return next(request);
  }

  const accessToken = inject(AuthService).accessToken();
  return next(accessToken
    ? request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : request);
};
