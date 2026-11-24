import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateStudentRequest, Student, StudentPhotoMetadata, UpdateStudentRequest } from './student.models';

@Injectable({ providedIn: 'root' })
export class StudentsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/students';

  list(isActive = true): Observable<Student[]> {
    return this.http.get<Student[]>(this.baseUrl, { params: { isActive: String(isActive) } });
  }

  create(request: CreateStudentRequest): Observable<Student> {
    return this.http.post<Student>(this.baseUrl, request);
  }

  update(studentId: string, request: UpdateStudentRequest): Observable<Student> {
    return this.http.put<Student>(`${this.baseUrl}/${encodeURIComponent(studentId)}`, request);
  }

  deactivate(studentId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(studentId)}`);
  }

  activate(studentId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${encodeURIComponent(studentId)}/activate`, null);
  }

  uploadPhoto(studentId: string, photo: File): Observable<StudentPhotoMetadata> {
    const body = new FormData();
    body.append('photo', photo, photo.name);
    return this.http.post<StudentPhotoMetadata>(`${this.baseUrl}/${encodeURIComponent(studentId)}/photo`, body);
  }

  photo(studentId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${encodeURIComponent(studentId)}/photo`, { responseType: 'blob' });
  }
}
