import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateStudentRequest, Student } from './student.models';

@Injectable({ providedIn: 'root' })
export class StudentsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/students';

  list(): Observable<Student[]> {
    return this.http.get<Student[]>(this.baseUrl);
  }

  create(request: CreateStudentRequest): Observable<Student> {
    return this.http.post<Student>(this.baseUrl, request);
  }
}
