import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

// One lazy feature per backend module. Add students / accounts / exams / devices the same way as attendance.
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/pages/login.component').then((m) => m.LoginComponent) },
  {
    path: 'attendance',
    canActivate: [authGuard],
    loadChildren: () => import('./features/attendance/attendance.routes').then((m) => m.ATTENDANCE_ROUTES),
  },
  { path: '', pathMatch: 'full', redirectTo: 'attendance' },
  { path: '**', redirectTo: 'attendance' },
];
