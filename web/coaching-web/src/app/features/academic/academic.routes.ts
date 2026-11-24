import { Routes } from '@angular/router';

export const ACADEMIC_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/academic-page.component').then((m) => m.AcademicPageComponent),
  },
];
