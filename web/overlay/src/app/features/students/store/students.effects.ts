import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, from, map, mergeMap, of, switchMap } from 'rxjs';
import { StudentsApi } from '../data/students.api';
import { StudentPhotoUrls } from '../data/student-photo-urls.service';
import { StudentsActions as A } from './students.actions';

export const load$ = createEffect(
  (actions$ = inject(Actions), api = inject(StudentsApi)) =>
    actions$.pipe(
      ofType(A.load),
      switchMap(() => api.list().pipe(
        map((students) => A.loadSuccess({ students })),
        catchError((error: unknown) => of(A.loadFailure({ error: getApiError(error, 'Unable to load students.') }))),
      )),
    ),
  { functional: true },
);

export const create$ = createEffect(
  (actions$ = inject(Actions), api = inject(StudentsApi)) =>
    actions$.pipe(
      ofType(A.create),
      exhaustMap(({ request }) => api.create(request).pipe(
        map((student) => A.createSuccess({ student })),
        catchError((error: unknown) => of(A.createFailure({ error: getApiError(error, 'Unable to add this student.') }))),
      )),
    ),
  { functional: true },
);

export const uploadPhoto$ = createEffect(
  (actions$ = inject(Actions), api = inject(StudentsApi)) =>
    actions$.pipe(
      ofType(A.uploadPhoto),
      exhaustMap(({ studentId, photo }) => api.uploadPhoto(studentId, photo).pipe(
        map((metadata) => A.uploadPhotoSuccess({ studentId, metadata })),
        catchError((error: unknown) => of(A.uploadPhotoFailure({
          studentId,
          error: getApiError(error, 'The student was added, but their photo could not be uploaded.'),
        }))),
      )),
    ),
  { functional: true },
);

export const loadPhotosAfterStudentsLoad$ = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(A.loadSuccess),
      mergeMap(({ students }) => from(
        students
          .filter((student) => student.hasPhoto)
          .map((student) => A.loadPhoto({ studentId: student.id })),
      )),
    ),
  { functional: true },
);

export const loadPhotoAfterUpload$ = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(A.uploadPhotoSuccess),
      map(({ studentId }) => A.loadPhoto({ studentId })),
    ),
  { functional: true },
);

export const loadPhoto$ = createEffect(
  (actions$ = inject(Actions), api = inject(StudentsApi), photoUrls = inject(StudentPhotoUrls)) =>
    actions$.pipe(
      ofType(A.loadPhoto),
      mergeMap(({ studentId }) => api.photo(studentId).pipe(
        map((photo) => A.loadPhotoSuccess({ studentId, objectUrl: photoUrls.replace(studentId, photo) })),
        catchError(() => of(A.loadPhotoFailure({ studentId }))),
      )),
    ),
  { functional: true },
);

function getApiError(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  const validationMessage = readValidationMessage(error.error);
  if (validationMessage) {
    return validationMessage;
  }

  const detail = readProblemDetail(error.error);
  if (detail) {
    return detail;
  }

  if (error.status === 0) {
    return 'The student service is not reachable. Check the API connection and try again.';
  }

  return fallback;
}

function readProblemDetail(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  return readText(value['detail']) ?? readText(value['title']);
}

function readValidationMessage(value: unknown): string | null {
  if (!isRecord(value) || !isRecord(value['errors'])) {
    return null;
  }

  for (const messages of Object.values(value['errors'])) {
    if (!Array.isArray(messages)) {
      continue;
    }

    const message = messages.map(readText).find((item): item is string => item !== null);
    if (message) {
      return message;
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function readText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}
