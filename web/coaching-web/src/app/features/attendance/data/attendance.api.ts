import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AttendanceRow, AttendanceStatus, CreateSessionRequest } from './attendance.models';

@Injectable({ providedIn: 'root' })
export class AttendanceApi {
  private http = inject(HttpClient);
  private base = '/api/attendance'; // proxied to the gateway (see proxy.conf.json)

  createSession(req: CreateSessionRequest) {
    return this.http.post<{ id: string }>(`${this.base}/sessions`, req);
  }
  records(sessionId: string) {
    return this.http.get<AttendanceRow[]>(`${this.base}/sessions/${sessionId}/records`);
  }
  mark(sessionId: string, studentId: string, status: AttendanceStatus) {
    return this.http.put<void>(`${this.base}/sessions/${sessionId}/students/${studentId}`, { status });
  }
}
