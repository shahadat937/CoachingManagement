import { createFeature, createReducer, on } from '@ngrx/store';
import { AuthSession } from '../auth.models';
import { AuthActions as A } from './auth.actions';

export interface AuthState {
  session: AuthSession | null;
  initialized: boolean;
  loginLoading: boolean;
  refreshing: boolean;
  generation: number;
  error: string | null;
}

const initialState: AuthState = {
  session: null,
  initialized: false,
  loginLoading: false,
  refreshing: false,
  generation: 0,
  error: null,
};

export const authFeature = createFeature({
  name: 'auth',
  reducer: createReducer(
    initialState,
    on(A.hydrateSuccess, (state, { session }) => ({ ...state, session, initialized: true })),
    on(A.login, (state) => ({
      ...state,
      session: null,
      loginLoading: true,
      refreshing: false,
      generation: state.generation + 1,
      error: null,
    })),
    on(A.loginSuccess, (state, { session }) => ({
      ...state,
      session,
      initialized: true,
      loginLoading: false,
      error: null,
    })),
    on(A.loginFailure, (state, { error }) => ({ ...state, loginLoading: false, error })),
    on(A.refresh, (state, { generation }) => generation === state.generation
      ? { ...state, refreshing: true }
      : state),
    on(A.refreshSuccess, (state, { session, generation }) => generation === state.generation
      ? {
        ...state,
        session,
        initialized: true,
        refreshing: false,
        error: null,
      }
      : state),
    on(A.refreshFailure, (state, { generation }) => generation === state.generation
      ? {
        ...state,
        session: null,
        initialized: true,
        refreshing: false,
      }
      : state),
    on(A.logout, A.clearSession, (state) => ({
      ...state,
      session: null,
      loginLoading: false,
      refreshing: false,
      generation: state.generation + 1,
      error: null,
    })),
    on(A.clearError, (state) => ({ ...state, error: null })),
  ),
});

export const {
  selectSession,
  selectInitialized,
  selectLoginLoading,
  selectRefreshing,
  selectGeneration,
  selectError,
} = authFeature;
