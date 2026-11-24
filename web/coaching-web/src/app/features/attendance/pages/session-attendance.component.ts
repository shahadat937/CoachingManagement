import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { I18nService } from '../../../core/i18n/i18n.service';
import { AttendanceStatus } from '../data/attendance.models';
import { AttendanceActions } from '../store/attendance.actions';
import { selectError, selectLoading, selectRows } from '../store/attendance.reducer';

@Component({
  selector: 'app-session-attendance',
  standalone: true,
  imports: [AsyncPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; } .back { color: #675feb; display: inline-flex; font-size: .76rem; font-weight: 750; margin-bottom: .75rem; text-decoration: none; } .head { align-items: end; display: flex; gap: 1rem; justify-content: space-between; margin-bottom: 1.4rem; } .eyebrow { color: #7169eb; font-size: .7rem; font-weight: 800; letter-spacing: .09em; margin: 0 0 .4rem; text-transform: uppercase; } h1 { color: #162945; font-size: clamp(1.45rem, 3vw, 2rem); letter-spacing: -.045em; margin: 0; } .head p:not(.eyebrow) { color: #7d8ba2; font-size: .8rem; margin: .42rem 0 0; } .live { align-items: center; background: #e9f8f3; border-radius: 100px; color: #168463; display: inline-flex; font-size: .7rem; font-weight: 800; gap: .4rem; padding: .42rem .65rem; } .live::before { background: currentColor; border-radius: 50%; content: ''; height: .42rem; width: .42rem; }
    .notice { background: #fff3f3; border: 1px solid #ffdada; border-radius: .7rem; color: #b64a53; font-size: .78rem; margin-bottom: 1rem; padding: .75rem .85rem; } .loading { color: #75849b; font-size: .82rem; padding: 1rem 0; } .panel { background: #fff; border: 1px solid #e7ecf5; border-radius: 1rem; overflow: hidden; } .panel-top { align-items: center; display: flex; justify-content: space-between; padding: 1rem 1.15rem; } .panel-top h2 { color: #2b3e5b; font-size: .95rem; margin: 0; } .panel-top span { color: #8a98ad; font-size: .72rem; } .table-wrap { overflow-x: auto; } table { border-collapse: collapse; min-width: 39rem; width: 100%; } th { background: #fafbfe; border-bottom: 1px solid #e9edf5; color: #78879f; font-size: .66rem; letter-spacing: .06em; padding: .7rem 1rem; text-align: left; text-transform: uppercase; } td { border-bottom: 1px solid #eef1f6; color: #475a75; font-size: .78rem; padding: .82rem 1rem; } tr:last-child td { border-bottom: 0; } .student-id { color: #2d415f; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .72rem; font-weight: 700; } .status { border-radius: 100px; display: inline-flex; font-size: .67rem; font-weight: 800; padding: .28rem .52rem; } .status.Present { background: #e7f8f1; color: #168663; } .status.Late { background: #fff4e8; color: #c87835; } .status.Absent { background: #fff0f1; color: #c45761; } .status.Excused { background: #f0efff; color: #695ee2; } .source { color: #8493a8; font-size: .7rem; } .actions { display: flex; flex-wrap: wrap; gap: .35rem; } .actions button { background: #f4f6fb; border: 1px solid #e5eaf3; border-radius: .45rem; color: #596a84; cursor: pointer; font: inherit; font-size: .67rem; font-weight: 700; padding: .34rem .45rem; } .actions button:hover:not(:disabled) { background: #eceaff; border-color: #d2cdfa; color: #6159e9; } .actions button:disabled { cursor: default; opacity: .45; }
    .empty { color: #8795aa; font-size: .8rem; padding: 2rem; text-align: center; } @media (max-width: 560px) { .head { align-items: start; flex-direction: column; } }
  `,
  template: `
    <a class="back" routerLink="/attendance">{{ i18n.t('attendance.back') }}</a>
    <section class="head"><div><p class="eyebrow">{{ i18n.t('attendance.liveRegister') }}</p><h1>{{ i18n.t('attendance.sessionAttendance') }}</h1><p>{{ i18n.t('attendance.description') }}</p></div><span class="live">{{ i18n.t('attendance.sessionActive') }}</span></section>
    @if (loading$ | async) { <p class="loading">{{ i18n.t('attendance.loading') }}</p> }
    @if (error$ | async; as err) { <p class="notice">{{ errorMessage(err) }}</p> }
    <section class="panel">
      <div class="panel-top"><h2>{{ i18n.t('attendance.register') }}</h2><span>{{ i18n.t('attendance.session', { id: sessionId() }) }}</span></div>
      <div class="table-wrap">
        @if (rows$ | async; as rows) {
          @if (rows.length) {
            <table><thead><tr><th>{{ i18n.t('attendance.student') }}</th><th>{{ i18n.t('attendance.status') }}</th><th>{{ i18n.t('attendance.source') }}</th><th>{{ i18n.t('attendance.markedAt') }}</th><th>{{ i18n.t('attendance.correctMark') }}</th></tr></thead><tbody>
              @for (row of rows; track row.studentId) {
                <tr><td class="student-id">{{ row.studentId }}</td><td><span class="status" [class]="row.status">{{ statusLabel(row.status) }}</span></td><td class="source">{{ sourceLabel(row.source) }}</td><td>{{ formatTime(row.markedAt) }}</td><td><div class="actions">@for (status of statuses; track status) { <button type="button" (click)="mark(row.studentId, status)" [disabled]="row.status === status">{{ statusLabel(status) }}</button> }</div></td></tr>
              }
            </tbody></table>
          } @else { <p class="empty">{{ i18n.t('attendance.empty') }}</p> }
        }
      </div>
    </section>
  `,
})
export class SessionAttendanceComponent implements OnInit {
  readonly sessionId = input.required<string>();
  readonly i18n = inject(I18nService);
  private readonly store = inject(Store);
  readonly rows$ = this.store.select(selectRows);
  readonly loading$ = this.store.select(selectLoading);
  readonly error$ = this.store.select(selectError);
  readonly statuses: AttendanceStatus[] = ['Present', 'Late', 'Absent', 'Excused'];

  ngOnInit(): void {
    this.store.dispatch(AttendanceActions.loadSession({ sessionId: this.sessionId() }));
  }

  mark(studentId: string, status: AttendanceStatus): void {
    this.store.dispatch(AttendanceActions.mark({ sessionId: this.sessionId(), studentId, status }));
  }

  statusLabel(status: AttendanceStatus): string {
    const key: Record<AttendanceStatus, string> = {
      Present: 'attendance.present',
      Late: 'attendance.late',
      Absent: 'attendance.absent',
      Excused: 'attendance.excused',
    };
    return this.i18n.t(key[status]);
  }

  sourceLabel(source: string): string {
    if (source.toLowerCase() === 'device') return this.i18n.t('attendance.device');
    if (source.toLowerCase() === 'manual') return this.i18n.t('attendance.manual');
    return source;
  }

  formatTime(value: string | Date): string {
    return new Intl.DateTimeFormat(this.i18n.language() === 'bn' ? 'bn-BD' : 'en-BD', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  }

  errorMessage(message: string): string {
    return this.i18n.errorMessage(message, 'attendance.requestFailed');
  }
}
