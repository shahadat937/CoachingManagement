import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { AttendanceApi } from '../data/attendance.api';
import { AttendanceActions as A } from './attendance.actions';

export const loadSession$ = createEffect(
  (actions$ = inject(Actions), api = inject(AttendanceApi)) =>
    actions$.pipe(
      ofType(A.loadSession),
      switchMap(({ sessionId }) =>
        api.records(sessionId).pipe(
          map((rows) => A.loadSessionSuccess({ sessionId, rows })),
          catchError((e) => of(A.loadSessionFailure({ error: e.message ?? 'Failed to load attendance' }))),
        ),
      ),
    ),
  { functional: true },
);

export const mark$ = createEffect(
  (actions$ = inject(Actions), api = inject(AttendanceApi)) =>
    actions$.pipe(
      ofType(A.mark),
      switchMap(({ sessionId, studentId, status }) =>
        api.mark(sessionId, studentId, status).pipe(
          map(() => A.markSuccess({ studentId, status })),
          catchError((e) => of(A.markFailure({ error: e.message ?? 'Failed to mark attendance' }))),
        ),
      ),
    ),
  { functional: true },
);
