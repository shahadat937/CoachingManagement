import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CoachingModuleApi {
  private readonly http = inject(HttpClient);

  list(path: string): Observable<Record<string, unknown>[]> {
    return this.http.get<unknown>(path).pipe(
      map((response) => Array.isArray(response) ? response as Record<string, unknown>[] : []),
    );
  }
}
