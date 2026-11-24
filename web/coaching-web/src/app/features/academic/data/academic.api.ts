import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AcademicBatch,
  AcademicClassSummary,
  AcademicRoutineSlot,
  AcademicSubject,
  CreateAcademicBatchRequest,
  CreateAcademicSubjectRequest,
  SaveAcademicSetupRequest,
  SaveAcademicSetupResponse,
  SaveAcademicRoutineRequest,
} from './academic.models';

@Injectable({ providedIn: 'root' })
export class AcademicApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/academic';

  classes(): Observable<AcademicClassSummary[]> {
    return this.http.get<AcademicClassSummary[]>(`${this.baseUrl}/classes`);
  }

  subjects(classLevel: number): Observable<AcademicSubject[]> {
    return this.http.get<AcademicSubject[]>(`${this.baseUrl}/subjects`, {
      params: new HttpParams().set('classLevel', String(classLevel)),
    });
  }

  batches(classLevel: number): Observable<AcademicBatch[]> {
    return this.http.get<AcademicBatch[]>(`${this.baseUrl}/batches`, {
      params: new HttpParams().set('classLevel', String(classLevel)),
    });
  }

  createSubject(request: CreateAcademicSubjectRequest): Observable<AcademicSubject> {
    return this.http.post<AcademicSubject>(`${this.baseUrl}/subjects`, request);
  }

  createBatch(request: CreateAcademicBatchRequest): Observable<AcademicBatch> {
    return this.http.post<AcademicBatch>(`${this.baseUrl}/batches`, request);
  }

  saveSetup(request: SaveAcademicSetupRequest): Observable<SaveAcademicSetupResponse> {
    return this.http.post<SaveAcademicSetupResponse>(`${this.baseUrl}/setup`, request);
  }

  routines(batchId: string): Observable<AcademicRoutineSlot[]> {
    return this.http.get<AcademicRoutineSlot[]>(`${this.baseUrl}/routines`, {
      params: new HttpParams().set('batchId', batchId),
    });
  }

  createRoutine(request: SaveAcademicRoutineRequest): Observable<AcademicRoutineSlot> {
    return this.http.post<AcademicRoutineSlot>(`${this.baseUrl}/routines`, request);
  }

  updateRoutine(id: string, request: SaveAcademicRoutineRequest): Observable<AcademicRoutineSlot> {
    return this.http.put<AcademicRoutineSlot>(`${this.baseUrl}/routines/${id}`, request);
  }

  deleteRoutine(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/routines/${id}`);
  }
}
