import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthService } from '../../../core/auth/auth.service';
import { AttendanceStatus } from '../data/attendance.models';
import { AttendanceActions } from '../store/attendance.actions';
import { selectError, selectLoading, selectRows } from '../store/attendance.reducer';

@Component({
  selector: 'app-session-attendance',
  standalone: true,
  imports: [AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h2>Session attendance</h2>
      <button type="button" (click)="logout()">Sign out</button>
    </header>
    @if (loading$ | async) { <p>Loading…</p> }
    @if (error$ | async; as err) { <p class="error">{{ err }}</p> }
    <table>
      <thead><tr><th>Student</th><th>Status</th><th>Source</th><th>Time</th><th>Correct</th></tr></thead>
      <tbody>
        @for (r of rows$ | async; track r.studentId) {
          <tr>
            <td>{{ r.studentId }}</td><td>{{ r.status }}</td><td>{{ r.source }}</td>
            <td>{{ r.markedAt }}</td>
            <td>
              @for (s of statuses; track s) {
                <button (click)="mark(r.studentId, s)" [disabled]="r.status === s">{{ s }}</button>
              }
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class SessionAttendanceComponent implements OnInit {
  sessionId = input.required<string>(); // bound from the route param (withComponentInputBinding)
  private store = inject(Store);
  private auth = inject(AuthService);
  private router = inject(Router);
  rows$ = this.store.select(selectRows);
  loading$ = this.store.select(selectLoading);
  error$ = this.store.select(selectError);
  statuses: AttendanceStatus[] = ['Present', 'Late', 'Absent', 'Excused'];

  ngOnInit() { this.store.dispatch(AttendanceActions.loadSession({ sessionId: this.sessionId() })); }
  mark(studentId: string, status: AttendanceStatus) {
    this.store.dispatch(AttendanceActions.mark({ sessionId: this.sessionId(), studentId, status }));
  }

  logout() {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
