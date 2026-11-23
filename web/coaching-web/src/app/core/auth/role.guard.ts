import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { CoachingRole, hasRole } from '../navigation/navigation';
import { AuthFacade } from './auth.facade';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  const roles = route.data['roles'] as CoachingRole[] | undefined;

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (!roles || hasRole(auth.session()?.user.role, roles)) {
    return true;
  }

  return router.createUrlTree(['/dashboard'], { queryParams: { notice: 'access-restricted' } });
};
