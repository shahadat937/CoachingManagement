import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import * as effects from './store/students.effects';
import { studentsFeature } from './store/students.reducer';

export const STUDENT_ROUTES: Routes = [
  {
    path: '',
    providers: [provideState(studentsFeature), provideEffects(effects)],
    loadComponent: () => import('./pages/students-page.component').then((m) => m.StudentsPageComponent),
  },
];
