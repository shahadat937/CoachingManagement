import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY, catchError, exhaustMap, from, map, mergeMap, of, switchMap, withLatestFrom } from 'rxjs';
import { StudentsApi } from '../data/students.api';
import { StudentPhotoUrls } from '../data/student-photo-urls.service';
import { StudentsActions as A } from './students.actions';
import { selectCurrentPage, selectIsActiveFilter, selectPageSize, selectStudents } from './students.reducer';

export const load$ = createEffect(
  (actions$ = inject(Actions), api = inject(StudentsApi), photoUrls = inject(StudentPhotoUrls)) =>
    actions$.pipe(
      ofType(A.load),
      switchMap(({ isActive, page, pageSize }) => {
        photoUrls.releaseAll();
        return api.list(isActive, page, pageSize).pipe(
          map((result) => A.loadSuccess({ result })),
          catchError((error: unknown) => of(A.loadFailure({ error: getApiError(error, 'Unable to load students.') }))),
        );
      }),
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

export const update$ = createEffect(
  (actions$ = inject(Actions), api = inject(StudentsApi)) =>
    actions$.pipe(
      ofType(A.update),
      exhaustMap(({ studentId, request }) => api.update(studentId, request).pipe(
        map((student) => A.updateSuccess({ student })),
        catchError((error: unknown) => of(A.updateFailure({ error: getApiError(error, 'Unable to update this student.') }))),
      )),
    ),
  { functional: true },
);

export const deactivate$ = createEffect(
  (actions$ = inject(Actions), api = inject(StudentsApi), photoUrls = inject(StudentPhotoUrls)) =>
    actions$.pipe(
      ofType(A.deactivate),
      exhaustMap(({ student }) => api.deactivate(student.id).pipe(
        map(() => {
          photoUrls.release(student.id);
          return A.deactivateSuccess({ student });
        }),
        catchError((error: unknown) => of(A.deactivateFailure({
          error: getApiError(error, 'Unable to make this student inactive.'),
        }))),
      )),
    ),
  { functional: true },
);

export const activate$ = createEffect(
  (actions$ = inject(Actions), api = inject(StudentsApi), photoUrls = inject(StudentPhotoUrls)) =>
    actions$.pipe(
      ofType(A.activate),
      exhaustMap(({ student }) => api.activate(student.id).pipe(
        map(() => {
          photoUrls.release(student.id);
          return A.activateSuccess({ student });
        }),
        catchError((error: unknown) => of(A.activateFailure({
          error: getApiError(error, 'Unable to reactivate this student.'),
        }))),
      )),
    ),
  { functional: true },
);

export const reloadDirectoryAfterMutation$ = createEffect(
  (actions$ = inject(Actions), store = inject(Store)) =>
    actions$.pipe(
      ofType(A.createSuccess, A.updateSuccess, A.deactivateSuccess, A.activateSuccess),
      withLatestFrom(
        store.select(selectIsActiveFilter),
        store.select(selectCurrentPage),
        store.select(selectPageSize),
      ),
      map(([, isActive, page, pageSize]) => A.load({ isActive, page, pageSize })),
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
      mergeMap(({ result }) => from(
        result.items
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
  (actions$ = inject(Actions), api = inject(StudentsApi), photoUrls = inject(StudentPhotoUrls), store = inject(Store)) =>
    actions$.pipe(
      ofType(A.loadPhoto),
      mergeMap(({ studentId }) => api.photo(studentId).pipe(
        withLatestFrom(store.select(selectStudents)),
        mergeMap(([photo, students]) => students.some((student) => student.id === studentId)
          ? of(A.loadPhotoSuccess({ studentId, objectUrl: photoUrls.replace(studentId, photo) }))
          : EMPTY),
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
