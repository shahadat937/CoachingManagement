import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import * as effects from './store/attendance.effects';
import { attendanceFeature } from './store/attendance.reducer';

export const ATTENDANCE_ROUTES: Routes = [
  {
    path: '',
    providers: [provideState(attendanceFeature), provideEffects(effects)],
    children: [
      {
        path: 'sessions/:sessionId',
        loadComponent: () => import('./pages/session-attendance.component').then((m) => m.SessionAttendanceComponent),
      },
    ],
  },
];
