import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState, provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { routes } from './app.routes';
import { AuthFacade } from './core/auth/auth.facade';
import { authInterceptor } from './core/auth/auth.interceptor';
import { AuthActions } from './core/auth/store/auth.actions';
import * as authEffects from './core/auth/store/auth.effects';
import { authFeature } from './core/auth/store/auth.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore(),
    provideState(authFeature),
    provideEffects(authEffects),
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthFacade) => () => auth.hydrate(),
      deps: [AuthFacade],
      multi: true,
    },
    ...(isDevMode()
      ? [provideStoreDevtools({
        maxAge: 25,
        logOnly: true,
        stateSanitizer: redactDevtoolsState,
        actionSanitizer: redactDevtoolsAction,
      })]
      : []),
  ],
};

function redactDevtoolsState(state: any): any {
  const session = state?.auth?.session;
  return session
    ? { ...state, auth: { ...state.auth, session: { ...session, accessToken: '[redacted]' } } }
    : state;
}

function redactDevtoolsAction(action: any): any {
  if (action?.type === AuthActions.login.type && action.request) {
    return { ...action, request: { ...action.request, password: '[redacted]' } };
  }

  if (action?.session) {
    return { ...action, session: { ...action.session, accessToken: '[redacted]' } };
  }

  return action;
}
