import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import * as effects from './store/attendance.effects';
import { attendanceFeature } from './store/attendance.reducer';
import { MODULE_DATA } from '../../core/navigation/navigation';

export const ATTENDANCE_ROUTES: Routes = [
  {
    path: '',
    providers: [provideState(attendanceFeature), provideEffects(effects)],
    children: [
      {
        path: '',
        pathMatch: 'full',
        data: MODULE_DATA['attendance'],
        loadComponent: () => import('../workspace/pages/module-page.component').then((m) => m.ModulePageComponent),
      },
      {
        path: 'sessions/:sessionId',
        loadComponent: () => import('./pages/session-attendance.component').then((m) => m.SessionAttendanceComponent),
      },
    ],
  },
];
