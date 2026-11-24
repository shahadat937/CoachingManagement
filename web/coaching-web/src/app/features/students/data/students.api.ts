import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateStudentRequest, Student, StudentPhotoMetadata } from './student.models';

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

  uploadPhoto(studentId: string, photo: File): Observable<StudentPhotoMetadata> {
    const body = new FormData();
    body.append('photo', photo, photo.name);
    return this.http.post<StudentPhotoMetadata>(`${this.baseUrl}/${encodeURIComponent(studentId)}/photo`, body);
  }

  photo(studentId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${encodeURIComponent(studentId)}/photo`, { responseType: 'blob' });
  }
}
