import { Routes } from '@angular/router';

// One lazy feature per backend module. Add students / accounts / exams / devices the same way as attendance.
export const routes: Routes = [
  { path: 'attendance', loadChildren: () => import('./features/attendance/attendance.routes').then((m) => m.ATTENDANCE_ROUTES) },
  { path: '', pathMatch: 'full', redirectTo: 'attendance' },
];
