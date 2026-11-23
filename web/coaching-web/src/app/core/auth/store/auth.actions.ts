import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { AuthSession, LoginRequest } from '../auth.models';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    Hydrate: emptyProps(),
    'Hydrate Success': props<{ session: AuthSession | null }>(),
    Login: props<{ request: LoginRequest; returnUrl: string }>(),
    'Login Success': props<{ session: AuthSession; returnUrl: string }>(),
    'Login Failure': props<{ error: string }>(),
    Refresh: props<{ generation: number }>(),
    'Refresh Success': props<{ session: AuthSession; generation: number }>(),
    'Refresh Failure': props<{ error: string; generation: number }>(),
    Logout: emptyProps(),
    'Logout Complete': emptyProps(),
    'Clear Session': emptyProps(),
    'Clear Error': emptyProps(),
  },
});
