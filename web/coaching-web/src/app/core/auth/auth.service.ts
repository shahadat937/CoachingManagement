import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthSession, LoginRequest } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  login(request: LoginRequest): Observable<AuthSession> {
    return this.http.post<AuthSession>('/api/auth/login', request, { withCredentials: true });
  }

  refresh(): Observable<AuthSession> {
    return this.http.post<AuthSession>('/api/auth/refresh', {}, { withCredentials: true });
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {}, { withCredentials: true });
  }
}
