import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { StudentsActions } from '../store/students.actions';
import {
  selectError,
  selectLoading,
  selectSaving,
  selectStudents,
  selectSuccess,
} from '../store/students.reducer';

@Component({
  selector: 'app-students-page',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .page-head { align-items: end; display: flex; gap: 1.5rem; justify-content: space-between; margin: .3rem 0 1.6rem; }
    .eyebrow { color: #7169eb; font-size: .72rem; font-weight: 800; letter-spacing: .09em; margin: 0 0 .48rem; text-transform: uppercase; }
    h1 { color: #162945; font-size: clamp(1.55rem, 3vw, 2.1rem); letter-spacing: -.045em; line-height: 1.08; margin: 0; }
    .description { color: #708099; font-size: .92rem; line-height: 1.55; margin: .55rem 0 0; max-width: 43rem; }
    .primary { align-items: center; background: #6159e9; border: 0; border-radius: .72rem; box-shadow: 0 10px 22px rgba(91, 80, 224, .22); color: #fff; cursor: pointer; display: inline-flex; font: inherit; font-size: .82rem; font-weight: 750; gap: .42rem; justify-content: center; padding: .78rem 1rem; white-space: nowrap; }
    .primary:hover:not(:disabled) { background: #544ce0; } .primary:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible { outline: 3px solid rgba(97, 89, 233, .28); outline-offset: 2px; } button:disabled { cursor: default; opacity: .6; }
    .metrics { display: grid; gap: 1rem; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-bottom: 1rem; }
    .metric { background: #fff; border: 1px solid #e8edf6; border-radius: .95rem; padding: 1rem 1.1rem; } .metric.indigo { border-top: 3px solid #6259e9; } .metric.cyan { border-top: 3px solid #27b9d9; } .metric.violet { border-top: 3px solid #9d73eb; }
    .metric span { color: #72819a; font-size: .75rem; font-weight: 700; } .metric strong { color: #263954; display: block; font-size: 1.35rem; letter-spacing: -.035em; margin: .48rem 0 .18rem; } .metric small { color: #8a97ab; font-size: .7rem; }
    .notice { align-items: flex-start; border: 1px solid; border-radius: .78rem; display: flex; font-size: .8rem; gap: .7rem; justify-content: space-between; margin: 0 0 1rem; padding: .78rem .92rem; } .notice span { line-height: 1.45; } .notice.error { background: #fff4f4; border-color: #ffd7dc; color: #ad4450; } .notice.success { background: #edfaf5; border-color: #ccefdc; color: #187654; } .notice button { background: transparent; border: 0; color: inherit; cursor: pointer; font: inherit; font-size: 1rem; line-height: 1; padding: 0; }
    .workspace { background: #fff; border: 1px solid #e8edf6; border-radius: 1rem; overflow: hidden; } .workspace-top { align-items: center; display: flex; gap: 1rem; justify-content: space-between; padding: 1.05rem 1.2rem; } .workspace-top h2 { color: #2b3e59; font-size: 1rem; letter-spacing: -.02em; margin: 0; } .workspace-top p { color: #8795a9; font-size: .72rem; margin: .25rem 0 0; }
    .search { align-items: center; background: #f5f7fb; border: 1px solid #e9edf5; border-radius: .65rem; color: #8795aa; display: flex; gap: .45rem; padding: .5rem .65rem; width: min(100%, 17rem); } .search svg { fill: none; height: .95rem; stroke: currentColor; stroke-width: 2; width: .95rem; } .search input { background: transparent; border: 0; color: #344762; font: inherit; font-size: .76rem; min-width: 0; outline: 0; width: 100%; }
    .table-wrap { overflow-x: auto; } table { border-collapse: collapse; min-width: 44rem; width: 100%; } th { background: #fafbfe; border-bottom: 1px solid #e9edf5; color: #77869d; font-size: .68rem; font-weight: 800; letter-spacing: .05em; padding: .72rem 1.1rem; text-align: left; text-transform: uppercase; } td { border-bottom: 1px solid #eef1f6; color: #445570; font-size: .78rem; padding: .92rem 1.1rem; white-space: nowrap; } tr:last-child td { border-bottom: 0; } .student-name { color: #2f415d; font-weight: 750; } .student-number { color: #635be8; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .72rem; font-weight: 700; } .muted { color: #8290a5; } .device { background: #f1efff; border-radius: 100px; color: #655cdb; display: inline-flex; font-size: .67rem; font-weight: 750; padding: .25rem .5rem; }
    .footer { align-items: center; border-top: 1px solid #eef1f6; color: #8391a5; display: flex; font-size: .72rem; justify-content: space-between; padding: .8rem 1.2rem; } .endpoint { color: #665eea; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .68rem; } .empty { color: #8492a7; font-size: .82rem; padding: 2.4rem 1.2rem; text-align: center; } .empty strong { color: #40536e; display: block; font-size: .92rem; margin-bottom: .3rem; }
    .dialog-backdrop { align-items: stretch; background: rgba(18, 32, 55, .45); display: flex; justify-content: flex-end; inset: 0; padding: 0; position: fixed; z-index: 30; } .dialog { background: #fff; box-shadow: -16px 0 44px rgba(20, 36, 62, .2); display: flex; flex-direction: column; max-width: 31rem; overflow-y: auto; padding: 1.3rem; width: min(100%, 31rem); } .dialog-head { align-items: flex-start; display: flex; gap: 1rem; justify-content: space-between; margin-bottom: 1.35rem; } .dialog-head h2 { color: #20334f; font-size: 1.2rem; letter-spacing: -.03em; margin: .15rem 0 0; } .dialog-head p { color: #78879e; font-size: .77rem; line-height: 1.45; margin: .4rem 0 0; } .close { align-items: center; background: #f4f6fa; border: 0; border-radius: .55rem; color: #63738c; cursor: pointer; display: inline-flex; font-size: 1.18rem; height: 2rem; justify-content: center; width: 2rem; }
    form { display: grid; gap: 1rem; } .field { display: grid; gap: .42rem; } .field label { color: #40536e; font-size: .76rem; font-weight: 750; } .optional { color: #91a0b2; font-size: .68rem; font-weight: 600; } .field input, .field select { background: #fff; border: 1px solid #dce4f0; border-radius: .62rem; box-sizing: border-box; color: #30435f; font: inherit; font-size: .84rem; padding: .7rem .75rem; width: 100%; } .field select { appearance: none; background-image: linear-gradient(45deg, transparent 50%, #71819a 50%), linear-gradient(135deg, #71819a 50%, transparent 50%); background-position: calc(100% - 15px) calc(50% - 2px), calc(100% - 10px) calc(50% - 2px); background-repeat: no-repeat; background-size: 5px 5px, 5px 5px; } .field input::placeholder { color: #a7b1bf; } .field input.invalid, .field select.invalid { border-color: #df7180; } .help, .field-error { font-size: .7rem; line-height: 1.35; margin: 0; } .help { color: #8997aa; } .field-error { color: #c54c5a; }
    .form-actions { align-items: center; border-top: 1px solid #edf0f5; display: flex; gap: .65rem; justify-content: flex-end; margin-top: .35rem; padding-top: 1rem; } .secondary { background: #f4f6fa; border: 1px solid #e4e9f1; border-radius: .65rem; color: #596b84; cursor: pointer; font: inherit; font-size: .78rem; font-weight: 750; padding: .7rem .85rem; } .saving-dot { animation: pulse 1s ease-in-out infinite alternate; background: currentColor; border-radius: 50%; display: inline-block; height: .42rem; margin-right: .35rem; width: .42rem; } @keyframes pulse { from { opacity: .35; } to { opacity: 1; } }
    @media (max-width: 700px) { .page-head { align-items: stretch; display: grid; grid-template-columns: 1fr; } .primary { width: 100%; } .metrics { grid-template-columns: 1fr; } .workspace-top { align-items: stretch; flex-direction: column; } .search { width: 100%; } .dialog { max-width: none; width: 100%; } } @media (max-width: 420px) { .dialog { padding: 1rem; } .form-actions { align-items: stretch; flex-direction: column-reverse; } .form-actions button { width: 100%; } }
  `,
  template: `
    <section class="page-head">
      <div>
        <p class="eyebrow">Student management</p>
        <h1>Student directory</h1>
        <p class="description">Add new learners, keep guardian contacts current and find each class record in one secure place.</p>
      </div>
      <button class="primary" type="button" (click)="openCreateForm()"><span aria-hidden="true">＋</span> Add student</button>
    </section>

    <section class="metrics" aria-label="Student directory summary">
      <article class="metric indigo"><span>Enrolled learners</span><strong>{{ students().length }}</strong><small>Records in the protected directory</small></article>
      <article class="metric cyan"><span>Class levels</span><strong>{{ classCount() }}</strong><small>Represented in the current results</small></article>
      <article class="metric violet"><span>Guardian contacts</span><strong>{{ contactCoverage() }}%</strong><small>Records with a contact number</small></article>
    </section>

    @if (success(); as message) { <div class="notice success" role="status"><span>{{ message }}</span><button type="button" (click)="clearFeedback()" aria-label="Dismiss confirmation">×</button></div> }
    @if (error(); as message) { <div class="notice error" role="alert"><span>{{ message }}</span><button type="button" (click)="clearFeedback()" aria-label="Dismiss error">×</button></div> }

    <section class="workspace" aria-labelledby="directory-heading">
      <div class="workspace-top">
        <div><h2 id="directory-heading">Learner records</h2><p>{{ loading() ? 'Refreshing the protected directory…' : 'Search by learner, student number, class or guardian phone.' }}</p></div>
        <label class="search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg><input [value]="query()" (input)="setQuery($any($event.target).value)" type="search" placeholder="Find a student" aria-label="Find a student" /></label>
      </div>
      <div class="table-wrap">
        @if (loading() && !students().length) {
          <p class="empty">Loading learner records…</p>
        } @else if (filteredStudents().length) {
          <table>
            <thead><tr><th>Student</th><th>Student no.</th><th>Class</th><th>Guardian contact</th><th>Device identity</th><th>Added</th></tr></thead>
            <tbody>
              @for (student of filteredStudents(); track student.id) {
                <tr>
                  <td class="student-name">{{ student.fullName }}</td>
                  <td class="student-number">{{ student.studentNo }}</td>
                  <td>Class {{ student.classLevel }}</td>
                  <td>{{ student.guardianPhone }}</td>
                  <td>@if (student.deviceUserId) { <span class="device">{{ student.deviceUserId }}</span> } @else { <span class="muted">Not assigned</span> }</td>
                  <td class="muted">{{ student.createdAt | date:'dd MMM y' }}</td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <div class="empty"><strong>{{ query().trim() ? 'No matching students' : 'No students yet' }}</strong>{{ query().trim() ? 'Try a student number, class or guardian phone.' : 'Add the first learner to begin building your directory.' }}</div>
        }
      </div>
      <footer class="footer"><span>Showing {{ filteredStudents().length }} of {{ students().length }} students</span><span class="endpoint">GET /api/students</span></footer>
    </section>

    @if (formOpen()) {
      <div class="dialog-backdrop" (click)="closeFromBackdrop($event)">
        <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="add-student-title">
          <header class="dialog-head">
            <div><p class="eyebrow">New learner</p><h2 id="add-student-title">Add student</h2><p>Save a learner record with the details your coaching team needs.</p></div>
            <button class="close" type="button" (click)="closeCreateForm()" aria-label="Close add student form">×</button>
          </header>
          <form [formGroup]="studentForm" (ngSubmit)="createStudent()" novalidate>
            <div class="field">
              <label for="studentNo">Student number</label>
              <input id="studentNo" formControlName="studentNo" autocomplete="off" placeholder="e.g. ST-1025" [class.invalid]="isInvalid('studentNo')" />
              @if (isInvalid('studentNo')) { <p class="field-error">Use 2–32 letters, numbers, spaces or hyphens.</p> }
            </div>
            <div class="field">
              <label for="fullName">Full name</label>
              <input id="fullName" formControlName="fullName" autocomplete="name" placeholder="Learner's full name" [class.invalid]="isInvalid('fullName')" />
              @if (isInvalid('fullName')) { <p class="field-error">Enter the learner's full name (2–128 characters).</p> }
            </div>
            <div class="field">
              <label for="classLevel">Class level</label>
              <select id="classLevel" formControlName="classLevel" [class.invalid]="isInvalid('classLevel')">
                <option [ngValue]="0" disabled>Select a class level</option>
                @for (level of classLevels; track level) { <option [ngValue]="level">Class {{ level }}</option> }
              </select>
              @if (isInvalid('classLevel')) { <p class="field-error">Choose a class level from 1 to 12.</p> }
            </div>
            <div class="field">
              <label for="guardianPhone">Guardian phone</label>
              <input id="guardianPhone" formControlName="guardianPhone" autocomplete="tel" inputmode="tel" placeholder="e.g. +880 1712 000 421" [class.invalid]="isInvalid('guardianPhone')" />
              @if (isInvalid('guardianPhone')) { <p class="field-error">Enter a valid guardian phone number.</p> }
            </div>
            <div class="field">
              <label for="deviceUserId">Device identity <span class="optional">Optional</span></label>
              <input id="deviceUserId" formControlName="deviceUserId" autocomplete="off" placeholder="Fingerprint / RFID / face ID" [class.invalid]="isInvalid('deviceUserId')" />
              <p class="help">Assign this only when the learner is already enrolled on an attendance device.</p>
              @if (isInvalid('deviceUserId')) { <p class="field-error">Device identity must be 64 characters or fewer.</p> }
            </div>
            <div class="form-actions">
              <button class="secondary" type="button" (click)="closeCreateForm()" [disabled]="saving()">Cancel</button>
              <button class="primary" type="submit" [disabled]="saving()">@if (saving()) { <span class="saving-dot"></span>Saving student… } @else { Add student }</button>
            </div>
          </form>
        </section>
      </div>
    }
  `,
})
export class StudentsPageComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);

  readonly students = this.store.selectSignal(selectStudents);
  readonly loading = this.store.selectSignal(selectLoading);
  readonly saving = this.store.selectSignal(selectSaving);
  readonly error = this.store.selectSignal(selectError);
  readonly success = this.store.selectSignal(selectSuccess);
  readonly query = signal('');
  readonly formOpen = signal(false);
  readonly classLevels = Array.from({ length: 12 }, (_, index) => index + 1);
  readonly filteredStudents = computed(() => filterStudents(this.students(), this.query()));
  readonly classCount = computed(() => new Set(this.students().map((student) => student.classLevel)).size);
  readonly contactCoverage = computed(() => {
    const students = this.students();
    return students.length ? Math.round((students.filter((student) => !!student.guardianPhone.trim()).length / students.length) * 100) : 0;
  });
  readonly studentForm = this.formBuilder.nonNullable.group({
    studentNo: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(32), Validators.pattern(/^[A-Za-z0-9][A-Za-z0-9 -]*$/)]],
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(128)]],
    classLevel: [0, [Validators.required, Validators.min(1), Validators.max(12)]],
    guardianPhone: ['', [Validators.required, Validators.maxLength(40), Validators.pattern(/^(?=(?:.*\d){6})\+?[0-9][0-9 ()-]*$/)]],
    deviceUserId: ['', [Validators.maxLength(64)]],
  });

  constructor() {
    this.actions$.pipe(
      ofType(StudentsActions.createSuccess),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.formOpen.set(false);
      this.studentForm.reset({ studentNo: '', fullName: '', classLevel: 0, guardianPhone: '', deviceUserId: '' });
    });
  }

  ngOnInit(): void {
    this.store.dispatch(StudentsActions.load());
  }

  openCreateForm(): void {
    this.store.dispatch(StudentsActions.clearFeedback());
    this.studentForm.reset({ studentNo: '', fullName: '', classLevel: 0, guardianPhone: '', deviceUserId: '' });
    this.formOpen.set(true);
  }

  closeCreateForm(): void {
    if (!this.saving()) {
      this.formOpen.set(false);
    }
  }

  closeFromBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeCreateForm();
    }
  }

  setQuery(value: string): void {
    this.query.set(value);
  }

  isInvalid(name: 'studentNo' | 'fullName' | 'classLevel' | 'guardianPhone' | 'deviceUserId'): boolean {
    const control = this.studentForm.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  clearFeedback(): void {
    this.store.dispatch(StudentsActions.clearFeedback());
  }

  createStudent(): void {
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }

    const value = this.studentForm.getRawValue();
    this.store.dispatch(StudentsActions.create({
      request: {
        studentNo: value.studentNo.trim(),
        fullName: value.fullName.trim(),
        classLevel: value.classLevel,
        guardianPhone: value.guardianPhone.trim(),
        deviceUserId: value.deviceUserId.trim() || null,
      },
    }));
  }
}

function filterStudents<T extends { studentNo: string; fullName: string; classLevel: number; guardianPhone: string; deviceUserId: string | null }>(students: T[], query: string): T[] {
  const term = query.trim().toLocaleLowerCase();
  if (!term) {
    return students;
  }

  return students.filter((student) => [
    student.studentNo,
    student.fullName,
    String(student.classLevel),
    student.guardianPhone,
    student.deviceUserId ?? '',
  ].some((value) => value.toLocaleLowerCase().includes(term)));
}
