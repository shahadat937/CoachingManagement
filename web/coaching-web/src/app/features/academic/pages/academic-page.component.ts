import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { AcademicApi } from '../data/academic.api';
import { AcademicBatch, AcademicClassSummary, AcademicSubject } from '../data/academic.models';

@Component({
  selector: 'app-academic-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; } * { box-sizing: border-box; }
    .page-head { align-items: end; display: flex; gap: 1.5rem; justify-content: space-between; margin: .3rem 0 1.45rem; } .eyebrow { color: #7169eb; font-size: .72rem; font-weight: 800; letter-spacing: .09em; margin: 0 0 .48rem; text-transform: uppercase; } h1 { color: #162945; font-size: clamp(1.55rem, 3vw, 2.1rem); letter-spacing: -.045em; line-height: 1.08; margin: 0; } .description { color: #708099; font-size: .9rem; line-height: 1.55; margin: .55rem 0 0; max-width: 44rem; } .class-caption { background: #eeecff; border-radius: .75rem; color: #5650c5; font-size: .78rem; font-weight: 800; padding: .75rem .9rem; text-align: center; white-space: nowrap; }
    .notice { align-items: center; border-radius: .72rem; display: flex; font-size: .78rem; gap: .7rem; justify-content: space-between; margin: 0 0 1rem; padding: .75rem .9rem; } .notice.success { background: #effbf6; border: 1px solid #ccefe1; color: #197451; } .notice.error { background: #fff4f4; border: 1px solid #ffd8dc; color: #a74753; } .notice button { background: transparent; border: 0; color: inherit; cursor: pointer; font: inherit; font-weight: 800; padding: .15rem; }
    .class-picker { background: #fff; border: 1px solid #e8edf6; border-radius: 1rem; margin-bottom: 1rem; padding: 1rem; } .class-picker-head { align-items: center; display: flex; gap: 1rem; justify-content: space-between; margin: 0 0 .8rem; } .class-picker-head h2 { color: #31445f; font-size: .95rem; margin: 0; } .class-picker-head p { color: #8391a5; font-size: .72rem; margin: .2rem 0 0; } .class-grid { display: grid; gap: .55rem; grid-template-columns: repeat(6, minmax(0, 1fr)); } .class-choice { background: #fafbfe; border: 1px solid #e5eaf4; border-radius: .72rem; color: #51627b; cursor: pointer; display: grid; gap: .2rem; padding: .7rem .45rem; text-align: left; transition: border-color .16s ease, background .16s ease, transform .16s ease; } .class-choice:hover { border-color: #bdb8f8; transform: translateY(-1px); } .class-choice.selected { background: linear-gradient(135deg, #655de8, #746bea); border-color: #655de8; box-shadow: 0 8px 17px rgba(91, 80, 224, .2); color: #fff; } .class-choice strong { font-size: .78rem; } .class-choice small { color: #8391a5; font-size: .64rem; line-height: 1.25; } .class-choice.selected small { color: #eeedff; }
    .summary { display: grid; gap: 1rem; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-bottom: 1rem; } .metric { background: #fff; border: 1px solid #e8edf6; border-radius: .95rem; padding: 1rem 1.1rem; } .metric.indigo { border-top: 3px solid #6259e9; } .metric.cyan { border-top: 3px solid #27b9d9; } .metric.violet { border-top: 3px solid #9d73eb; } .metric span { color: #72819a; font-size: .73rem; font-weight: 750; } .metric strong { color: #263954; display: block; font-size: 1.35rem; letter-spacing: -.035em; margin: .45rem 0 .15rem; } .metric small { color: #8a97ab; font-size: .68rem; }
    .setup-grid { display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); } .panel { background: #fff; border: 1px solid #e8edf6; border-radius: 1rem; overflow: hidden; } .panel-head { align-items: flex-start; border-bottom: 1px solid #edf0f5; display: flex; gap: 1rem; justify-content: space-between; padding: 1rem 1.15rem; } .panel-head h2 { color: #2d405c; font-size: 1rem; margin: 0; } .panel-head p { color: #8492a7; font-size: .72rem; line-height: 1.4; margin: .26rem 0 0; } .count { background: #f0efff; border-radius: 100px; color: #5c54cf; font-size: .68rem; font-weight: 800; padding: .3rem .5rem; white-space: nowrap; }
    .records { list-style: none; margin: 0; padding: 0; } .record { align-items: center; border-bottom: 1px solid #f0f2f7; display: flex; gap: .8rem; justify-content: space-between; padding: .78rem 1.15rem; } .record:last-child { border-bottom: 0; } .record-title { color: #3c506c; display: block; font-size: .8rem; font-weight: 750; } .record-code { color: #8997aa; display: block; font-size: .68rem; margin-top: .16rem; } .tag { background: #edf8f4; border-radius: 100px; color: #168362; font-size: .66rem; font-weight: 800; padding: .28rem .47rem; white-space: nowrap; } .empty { color: #8492a7; font-size: .78rem; line-height: 1.45; margin: 0; padding: 1.2rem 1.15rem; text-align: center; }
    .entry { background: #fafbfe; border-top: 1px solid #edf0f5; display: grid; gap: .75rem; padding: .9rem 1.15rem 1.05rem; } .entry h3 { color: #40536e; font-size: .76rem; margin: 0; } .field-grid { display: grid; gap: .65rem; grid-template-columns: minmax(0, 1.4fr) minmax(6rem, .8fr); } .field { display: grid; gap: .32rem; } .field label { color: #63738b; font-size: .68rem; font-weight: 800; } .field input { background: #fff; border: 1px solid #dce4f0; border-radius: .6rem; color: #30435f; font: inherit; font-size: .76rem; min-width: 0; outline: 0; padding: .62rem .68rem; width: 100%; } .field input:focus { border-color: #7169eb; box-shadow: 0 0 0 3px rgba(113, 105, 235, .12); } .field input.invalid { border-color: #db6875; } .field-error { color: #c54c5a; font-size: .65rem; line-height: 1.25; } .entry-actions { align-items: center; display: flex; gap: .65rem; justify-content: flex-end; } .hint { color: #8997aa; font-size: .66rem; line-height: 1.35; margin-right: auto; } .primary { background: #6159e9; border: 0; border-radius: .62rem; box-shadow: 0 8px 18px rgba(91, 80, 224, .18); color: #fff; cursor: pointer; font: inherit; font-size: .73rem; font-weight: 800; padding: .66rem .78rem; } .primary:disabled { cursor: not-allowed; opacity: .6; } .read-only { background: #f8f9fc; border-top: 1px solid #edf0f5; color: #7c8ba0; font-size: .7rem; line-height: 1.4; margin: 0; padding: .8rem 1.15rem; }
    .loading { align-items: center; color: #78879c; display: flex; font-size: .73rem; gap: .45rem; } .loading i { animation: pulse 1s ease-in-out infinite alternate; background: #736be9; border-radius: 50%; height: .45rem; width: .45rem; } @keyframes pulse { from { opacity: .35; } to { opacity: 1; } }
    @media (max-width: 850px) { .class-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } .setup-grid { grid-template-columns: 1fr; } } @media (max-width: 650px) { .page-head, .class-picker-head { align-items: stretch; flex-direction: column; } .class-caption { text-align: left; } .summary { grid-template-columns: 1fr; } .class-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } .field-grid { grid-template-columns: 1fr; } } @media (max-width: 400px) { .class-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .entry-actions { align-items: stretch; flex-direction: column; } .hint { margin-right: 0; } .primary { width: 100%; } }
  `,
  template: `
    <section class="page-head">
      <div>
        <p class="eyebrow">Curriculum workspace</p>
        <h1>Academic setup</h1>
        <p class="description">Configure subjects by class, then create as many teaching batches as each class needs.</p>
      </div>
      <div class="class-caption">Class {{ selectedClassLevel() }} selected</div>
    </section>

    @if (success(); as message) { <div class="notice success" role="status"><span>{{ message }}</span><button type="button" (click)="clearFeedback()" aria-label="Dismiss confirmation">×</button></div> }
    @if (error(); as message) { <div class="notice error" role="alert"><span>{{ message }}</span><button type="button" (click)="clearFeedback()" aria-label="Dismiss error">×</button></div> }

    <section class="class-picker" aria-labelledby="class-picker-title">
      <div class="class-picker-head">
        <div><h2 id="class-picker-title">Choose a class</h2><p>Subjects are shared by all batches within the selected class.</p></div>
        @if (loading()) { <span class="loading"><i></i>Refreshing setup</span> }
      </div>
      <div class="class-grid" role="list" aria-label="Class levels">
        @for (level of classLevels; track level) {
          <button class="class-choice" [class.selected]="selectedClassLevel() === level" type="button" (click)="selectClass(level)" [attr.aria-pressed]="selectedClassLevel() === level">
            <strong>Class {{ level }}</strong><small>{{ classSummaryFor(level).subjectCount }} subjects · {{ classSummaryFor(level).batchCount }} batches</small>
          </button>
        }
      </div>
    </section>

    <section class="summary" aria-label="Selected class summary">
      <article class="metric indigo"><span>Selected class</span><strong>Class {{ selectedClassLevel() }}</strong><small>Matches the student class level</small></article>
      <article class="metric cyan"><span>Class subjects</span><strong>{{ currentSummary().subjectCount }}</strong><small>Available to every batch</small></article>
      <article class="metric violet"><span>Teaching batches</span><strong>{{ currentSummary().batchCount }}</strong><small>Morning, evening or custom groups</small></article>
    </section>

    <section class="setup-grid">
      <article class="panel" aria-labelledby="subjects-title">
        <header class="panel-head"><div><h2 id="subjects-title">Class {{ selectedClassLevel() }} subjects</h2><p>Subjects belong to the class, not to an individual batch.</p></div><span class="count">{{ subjects().length }}</span></header>
        @if (subjects().length) {
          <ul class="records">
            @for (subject of subjects(); track subject.id) { <li class="record"><span><strong class="record-title">{{ subject.name }}</strong><small class="record-code">{{ subject.code }}</small></span><span class="tag">Class {{ subject.classLevel }}</span></li> }
          </ul>
        } @else { <p class="empty">No subjects have been added for this class yet.</p> }
        @if (canManage()) {
          <form class="entry" [formGroup]="subjectForm" (ngSubmit)="saveSubject()" novalidate>
            <h3>Add a subject</h3>
            <div class="field-grid">
              <div class="field"><label for="subject-name">Subject name</label><input id="subject-name" formControlName="name" maxlength="120" placeholder="e.g. General Mathematics" [class.invalid]="subjectInvalid('name')" />@if (subjectInvalid('name')) { <small class="field-error">Enter a subject name.</small> }</div>
              <div class="field"><label for="subject-code">Code</label><input id="subject-code" formControlName="code" maxlength="32" placeholder="MATH-08" [class.invalid]="subjectInvalid('code')" />@if (subjectInvalid('code')) { <small class="field-error">Use letters, numbers, hyphens, or underscores only.</small> }</div>
            </div>
            <div class="entry-actions"><span class="hint">Added to Class {{ selectedClassLevel() }}.</span><button class="primary" type="submit" [disabled]="saving()">{{ saving() ? 'Saving...' : 'Add subject' }}</button></div>
          </form>
        } @else { <p class="read-only">You can view subjects. An administrator can add or change academic setup.</p> }
      </article>

      <article class="panel" aria-labelledby="batches-title">
        <header class="panel-head"><div><h2 id="batches-title">Class {{ selectedClassLevel() }} batches</h2><p>Use batches to organise multiple groups for the same class.</p></div><span class="count">{{ batches().length }}</span></header>
        @if (batches().length) {
          <ul class="records">
            @for (batch of batches(); track batch.id) { <li class="record"><span><strong class="record-title">{{ batch.name }}</strong><small class="record-code">{{ batch.code || 'No batch code' }}</small></span><span class="tag">Class {{ batch.classLevel }}</span></li> }
          </ul>
        } @else { <p class="empty">No batches have been added for this class yet.</p> }
        @if (canManage()) {
          <form class="entry" [formGroup]="batchForm" (ngSubmit)="saveBatch()" novalidate>
            <h3>Add a batch</h3>
            <div class="field-grid">
              <div class="field"><label for="batch-name">Batch name</label><input id="batch-name" formControlName="name" maxlength="100" placeholder="e.g. Morning batch" [class.invalid]="batchInvalid('name')" />@if (batchInvalid('name')) { <small class="field-error">Enter a batch name.</small> }</div>
              <div class="field"><label for="batch-code">Code <span>(optional)</span></label><input id="batch-code" formControlName="code" maxlength="32" placeholder="MOR-08" [class.invalid]="batchInvalid('code')" />@if (batchInvalid('code')) { <small class="field-error">Use letters, numbers, hyphens, or underscores only.</small> }</div>
            </div>
            <div class="entry-actions"><span class="hint">Several batches can belong to Class {{ selectedClassLevel() }}.</span><button class="primary" type="submit" [disabled]="saving()">{{ saving() ? 'Saving...' : 'Add batch' }}</button></div>
          </form>
        } @else { <p class="read-only">You can view batches. An administrator can add or change academic setup.</p> }
      </article>
    </section>
  `,
})
export class AcademicPageComponent implements OnInit {
  private readonly api = inject(AcademicApi);
  private readonly auth = inject(AuthFacade);
  private readonly formBuilder = inject(FormBuilder);
  private loadVersion = 0;

  readonly classLevels = Array.from({ length: 12 }, (_, index) => index + 1);
  readonly selectedClassLevel = signal(1);
  readonly classSummaries = signal<AcademicClassSummary[]>(this.classLevels.map((classLevel) => ({ classLevel, subjectCount: 0, batchCount: 0 })));
  readonly subjects = signal<AcademicSubject[]>([]);
  readonly batches = signal<AcademicBatch[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly canManage = computed(() => this.auth.session()?.user.role === 'Admin');
  readonly currentSummary = computed(() => this.classSummaryFor(this.selectedClassLevel()));
  readonly subjectForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(120)]],
    code: ['', [Validators.required, Validators.maxLength(32), Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
  });
  readonly batchForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    code: ['', [Validators.maxLength(32), Validators.pattern(/^$|^[A-Za-z0-9_-]+$/)]],
  });

  ngOnInit(): void {
    this.refresh();
  }

  selectClass(level: number): void {
    if (level === this.selectedClassLevel() || this.saving()) {
      return;
    }

    this.selectedClassLevel.set(level);
    this.subjects.set([]);
    this.batches.set([]);
    this.subjectForm.reset({ name: '', code: '' });
    this.batchForm.reset({ name: '', code: '' });
    this.clearFeedback();
    this.refresh();
  }

  refresh(): void {
    const level = this.selectedClassLevel();
    const version = ++this.loadVersion;
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      classes: this.api.classes(),
      subjects: this.api.subjects(level),
      batches: this.api.batches(level),
    }).subscribe({
      next: ({ classes, subjects, batches }) => {
        if (version !== this.loadVersion) {
          return;
        }

        this.classSummaries.set(this.withAllClassLevels(classes));
        this.subjects.set(subjects);
        this.batches.set(batches);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        if (version !== this.loadVersion) {
          return;
        }

        this.loading.set(false);
        this.error.set(readApiError(error, 'Unable to load academic setup. Check the Academic service and try again.'));
      },
    });
  }

  saveSubject(): void {
    if (!this.canManage() || this.saving()) {
      return;
    }

    if (this.subjectForm.invalid) {
      this.subjectForm.markAllAsTouched();
      return;
    }

    const value = this.subjectForm.getRawValue();
    this.saving.set(true);
    this.clearFeedback();
    this.api.createSubject({
      classLevel: this.selectedClassLevel(),
      name: value.name.trim(),
      code: value.code.trim(),
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.subjectForm.reset({ name: '', code: '' });
        this.success.set(`Subject added to Class ${this.selectedClassLevel()}.`);
        this.refresh();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(readApiError(error, 'Unable to add this subject.'));
      },
    });
  }

  saveBatch(): void {
    if (!this.canManage() || this.saving()) {
      return;
    }

    if (this.batchForm.invalid) {
      this.batchForm.markAllAsTouched();
      return;
    }

    const value = this.batchForm.getRawValue();
    this.saving.set(true);
    this.clearFeedback();
    this.api.createBatch({
      classLevel: this.selectedClassLevel(),
      name: value.name.trim(),
      code: value.code.trim() || null,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.batchForm.reset({ name: '', code: '' });
        this.success.set(`Batch added to Class ${this.selectedClassLevel()}.`);
        this.refresh();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(readApiError(error, 'Unable to add this batch.'));
      },
    });
  }

  subjectInvalid(name: 'name' | 'code'): boolean {
    const control = this.subjectForm.controls[name];
    return control.invalid && (control.dirty || control.touched);
  }

  batchInvalid(name: 'name' | 'code'): boolean {
    const control = this.batchForm.controls[name];
    return control.invalid && (control.dirty || control.touched);
  }

  classSummaryFor(level: number): AcademicClassSummary {
    return this.classSummaries().find((summary) => summary.classLevel === level)
      ?? { classLevel: level, subjectCount: 0, batchCount: 0 };
  }

  clearFeedback(): void {
    this.error.set(null);
    this.success.set(null);
  }

  private withAllClassLevels(summaries: AcademicClassSummary[]): AcademicClassSummary[] {
    return this.classLevels.map((classLevel) => summaries.find((summary) => summary.classLevel === classLevel)
      ?? { classLevel, subjectCount: 0, batchCount: 0 });
  }
}

function readApiError(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  const validation = firstValidationError(error.error);
  if (validation) {
    return validation;
  }

  if (isRecord(error.error)) {
    const detail = text(error.error['detail']) ?? text(error.error['title']);
    if (detail) {
      return detail;
    }
  }

  return error.status === 0 ? 'The Academic service is not reachable. Check the API connection and try again.' : fallback;
}

function firstValidationError(value: unknown): string | null {
  if (!isRecord(value) || !isRecord(value['errors'])) {
    return null;
  }

  for (const messages of Object.values(value['errors'])) {
    if (!Array.isArray(messages)) {
      continue;
    }

    const message = messages.map(text).find((item): item is string => item !== null);
    if (message) {
      return message;
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}
