import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) {
    return true;
  }

  const router = inject(Router);
  const loginUrl = router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  return auth.refresh().pipe(
    map(() => true),
    catchError(() => {
      auth.clearSession();
      return of(loginUrl);
    }),
  );
};
