import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { MODULE_DATA } from './core/navigation/navigation';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/pages/login.component').then((m) => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      { path: 'dashboard', title: 'Dashboard', loadComponent: () => import('./features/dashboard/pages/dashboard.component').then((m) => m.DashboardComponent) },
      {
        path: 'students',
        title: 'Students',
        canActivate: [roleGuard],
        data: MODULE_DATA['students'],
        loadChildren: () => import('./features/students/students.routes').then((m) => m.STUDENT_ROUTES),
      },
      {
        path: 'academic',
        title: 'Academic',
        canActivate: [roleGuard],
        data: MODULE_DATA['academic'],
        loadChildren: () => import('./features/academic/academic.routes').then((m) => m.ACADEMIC_ROUTES),
      },
      {
        path: 'attendance',
        title: 'Attendance',
        canActivate: [roleGuard],
        data: MODULE_DATA['attendance'],
        loadChildren: () => import('./features/attendance/attendance.routes').then((m) => m.ATTENDANCE_ROUTES),
      },
      { path: 'exams', title: 'Examinations', canActivate: [roleGuard], data: MODULE_DATA['exams'], loadComponent: () => import('./features/workspace/pages/module-page.component').then((m) => m.ModulePageComponent) },
      { path: 'finance', title: 'Finance', canActivate: [roleGuard], data: MODULE_DATA['finance'], loadComponent: () => import('./features/workspace/pages/module-page.component').then((m) => m.ModulePageComponent) },
      { path: 'devices', title: 'Devices', canActivate: [roleGuard], data: MODULE_DATA['devices'], loadComponent: () => import('./features/workspace/pages/module-page.component').then((m) => m.ModulePageComponent) },
      { path: 'users', title: 'Team access', canActivate: [roleGuard], data: MODULE_DATA['users'], loadComponent: () => import('./features/workspace/pages/module-page.component').then((m) => m.ModulePageComponent) },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
