import { Injectable } from '@angular/core';

/**
 * Keeps temporary object URLs out of API models and makes replacement/cleanup explicit.
 * Photo bytes are always requested through HttpClient, so the auth interceptor can attach
 * the bearer token before the browser receives a local blob URL for rendering.
 */
@Injectable({ providedIn: 'root' })
export class StudentPhotoUrls {
  private readonly urls = new Map<string, string>();

  replace(studentId: string, photo: Blob): string {
    this.release(studentId);
    const url = URL.createObjectURL(photo);
    this.urls.set(studentId, url);
    return url;
  }

  release(studentId: string): void {
    const url = this.urls.get(studentId);
    if (url) {
      URL.revokeObjectURL(url);
      this.urls.delete(studentId);
    }
  }

  releaseAll(): void {
    for (const studentId of [...this.urls.keys()]) {
      this.release(studentId);
    }
  }
}
