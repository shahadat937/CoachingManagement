import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AcademicBatch,
  AcademicClassSummary,
  AcademicSubject,
  CreateAcademicBatchRequest,
  CreateAcademicSubjectRequest,
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
}
