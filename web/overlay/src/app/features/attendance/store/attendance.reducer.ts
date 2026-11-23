import { createFeature, createReducer, on } from '@ngrx/store';
import { AttendanceRow } from '../data/attendance.models';
import { AttendanceActions as A } from './attendance.actions';

export interface AttendanceState {
  sessionId: string | null;
  rows: AttendanceRow[];
  loading: boolean;
  error: string | null;
}

const initialState: AttendanceState = { sessionId: null, rows: [], loading: false, error: null };

export const attendanceFeature = createFeature({
  name: 'attendance',
  reducer: createReducer(
    initialState,
    on(A.loadSession, (s) => ({ ...s, loading: true, error: null })),
    on(A.loadSessionSuccess, (s, { sessionId, rows }) => ({ ...s, sessionId, rows, loading: false })),
    on(A.loadSessionFailure, A.markFailure, (s, { error }) => ({ ...s, loading: false, error })),
    on(A.markSuccess, (s, { studentId, status }) => {
      const exists = s.rows.some((r) => r.studentId === studentId);
      const rows = exists
        ? s.rows.map((r) => (r.studentId === studentId ? { ...r, status, source: 'Manual' as const } : r))
        : [...s.rows, { studentId, status, source: 'Manual' as const, markedAt: new Date().toISOString() }];
      return { ...s, rows };
    }),
    on(A.clearError, (s) => ({ ...s, error: null })),
  ),
});

export const { selectRows, selectLoading, selectError, selectSessionId } = attendanceFeature;
