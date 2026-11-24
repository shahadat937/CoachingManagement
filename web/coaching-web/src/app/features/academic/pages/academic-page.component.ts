import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { AcademicApi } from '../data/academic.api';
import {
  AcademicBatch,
  AcademicClassSummary,
  AcademicRoutineSlot,
  AcademicSetupBatchInput,
  AcademicSetupSubjectInput,
  AcademicSubject,
} from '../data/academic.models';

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
    .drafts { background: #fffdf3; border-bottom: 1px solid #f5ebbd; border-top: 1px solid #f5ebbd; list-style: none; margin: 0; padding: 0; } .draft-label { color: #927331; display: block; font-size: .65rem; font-weight: 800; letter-spacing: .04em; padding: .55rem 1.15rem 0; text-transform: uppercase; } .draft { align-items: center; display: flex; gap: .8rem; justify-content: space-between; padding: .62rem 1.15rem; } .draft:last-child { padding-bottom: .78rem; } .draft .record-title { color: #69572e; } .draft .record-code { color: #9d8c63; } .queued-tag { background: #fff3c9; border-radius: 100px; color: #97752d; font-size: .63rem; font-weight: 800; padding: .28rem .45rem; white-space: nowrap; } .remove { background: transparent; border: 1px solid #e6c877; border-radius: .48rem; color: #927331; cursor: pointer; font: inherit; font-size: .67rem; font-weight: 800; padding: .35rem .48rem; } .remove:hover { background: #fff3c9; }
    .entry { background: #fafbfe; border-top: 1px solid #edf0f5; display: grid; gap: .75rem; padding: .9rem 1.15rem 1.05rem; } .entry h3 { color: #40536e; font-size: .76rem; margin: 0; } .field-grid { display: grid; gap: .65rem; grid-template-columns: minmax(0, 1.4fr) minmax(6rem, .8fr); } .field { display: grid; gap: .32rem; } .field label { color: #63738b; font-size: .68rem; font-weight: 800; } .field input, .field select { background: #fff; border: 1px solid #dce4f0; border-radius: .6rem; color: #30435f; font: inherit; font-size: .76rem; min-width: 0; outline: 0; padding: .62rem .68rem; width: 100%; } .field input:focus, .field select:focus { border-color: #7169eb; box-shadow: 0 0 0 3px rgba(113, 105, 235, .12); } .field input.invalid, .field select.invalid { border-color: #db6875; } .field-error { color: #c54c5a; font-size: .65rem; line-height: 1.25; } .entry-actions { align-items: center; display: flex; gap: .65rem; justify-content: flex-end; } .hint { color: #8997aa; font-size: .66rem; line-height: 1.35; margin-right: auto; } .primary { background: #6159e9; border: 0; border-radius: .62rem; box-shadow: 0 8px 18px rgba(91, 80, 224, .18); color: #fff; cursor: pointer; font: inherit; font-size: .73rem; font-weight: 800; padding: .66rem .78rem; } .primary:disabled { cursor: not-allowed; opacity: .6; } .read-only { background: #f8f9fc; border-top: 1px solid #edf0f5; color: #7c8ba0; font-size: .7rem; line-height: 1.4; margin: 0; padding: .8rem 1.15rem; }
    .save-all { align-items: center; background: linear-gradient(110deg, #f2f1ff, #f7f6ff); border: 1px solid #dcd9ff; border-radius: 1rem; display: flex; gap: 1rem; justify-content: space-between; margin-top: 1rem; padding: .9rem 1rem; } .save-all strong { color: #413b9e; display: block; font-size: .82rem; } .save-all p { color: #6f7394; font-size: .7rem; margin: .22rem 0 0; } .save-all .primary { white-space: nowrap; }
    .routine-panel { background: #fff; border: 1px solid #e1e5f5; border-radius: 1rem; margin-top: 1rem; overflow: hidden; } .routine-head { align-items: flex-start; background: linear-gradient(110deg, #f6f5ff, #f7fbff); border-bottom: 1px solid #e5e8f6; display: flex; gap: 1rem; justify-content: space-between; padding: 1.05rem 1.15rem; } .routine-head h2 { color: #2f3f60; margin: 0; } .batch-tabs { display: flex; gap: .5rem; overflow-x: auto; padding: .85rem 1.15rem; } .batch-tab { background: #fff; border: 1px solid #dbe3f1; border-radius: 100px; color: #62738a; cursor: pointer; font: inherit; font-size: .71rem; font-weight: 750; padding: .45rem .68rem; white-space: nowrap; } .batch-tab.selected { background: #6259e9; border-color: #6259e9; color: #fff; } .routine-board-wrap { overflow-x: auto; padding: 0 1.15rem 1.1rem; } .routine-board { display: grid; gap: .65rem; grid-template-columns: repeat(7, minmax(9.5rem, 1fr)); min-width: 68rem; } .routine-day { background: #fafbfe; border: 1px solid #e9edf5; border-radius: .75rem; min-height: 12rem; overflow: hidden; } .routine-day-head { background: #f1f0ff; color: #554ec6; display: flex; font-size: .73rem; font-weight: 800; justify-content: space-between; padding: .55rem .62rem; } .routine-slots { display: grid; gap: .45rem; padding: .5rem; } .routine-slot { background: #fff; border: 1px solid #dfe5f1; border-left: 3px solid #6b63e8; border-radius: .52rem; display: grid; gap: .25rem; padding: .5rem; } .routine-time { color: #5c54cd; font-size: .64rem; font-weight: 850; } .link-button { background: transparent; border: 0; color: #5f57d7; cursor: pointer; font: inherit; font-size: .63rem; font-weight: 800; padding: .1rem 0; } .link-button.danger { color: #c35461; } .routine-fields { display: grid; gap: .65rem; grid-template-columns: minmax(8rem, 1.35fr) minmax(7rem, .85fr) repeat(2, minmax(6.5rem, .7fr)) minmax(7rem, .8fr) minmax(8rem, 1fr); } .secondary { background: #fff; border: 1px solid #d7deeb; border-radius: .62rem; color: #62738a; cursor: pointer; font: inherit; font-size: .73rem; font-weight: 800; padding: .62rem .75rem; } .secondary:disabled { cursor: not-allowed; opacity: .6; } .routine-read-only { background: #f8f9fc; border-top: 1px solid #edf0f5; color: #7c8ba0; font-size: .7rem; line-height: 1.4; margin: 0; padding: .8rem 1.15rem; }
    .loading { align-items: center; color: #78879c; display: flex; font-size: .73rem; gap: .45rem; } .loading i { animation: pulse 1s ease-in-out infinite alternate; background: #736be9; border-radius: 50%; height: .45rem; width: .45rem; } @keyframes pulse { from { opacity: .35; } to { opacity: 1; } }
    @media (max-width: 850px) { .class-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } .setup-grid { grid-template-columns: 1fr; } .routine-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); } } @media (max-width: 650px) { .page-head, .class-picker-head, .save-all, .routine-head { align-items: stretch; flex-direction: column; } .class-caption { text-align: left; } .summary { grid-template-columns: 1fr; } .class-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } .field-grid, .routine-fields { grid-template-columns: 1fr; } } @media (max-width: 400px) { .class-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .entry-actions { align-items: stretch; flex-direction: column; } .hint { margin-right: 0; } .primary { width: 100%; } }
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

    @if (success(); as message) { <div class="notice success" role="status"><span>{{ message }}</span><button type="button" (click)="clearFeedback()" aria-label="Dismiss confirmation">Close</button></div> }
    @if (error(); as message) { <div class="notice error" role="alert"><span>{{ message }}</span><button type="button" (click)="clearFeedback()" aria-label="Dismiss error">Close</button></div> }

    <section class="class-picker" aria-labelledby="class-picker-title">
      <div class="class-picker-head">
        <div><h2 id="class-picker-title">Choose a class</h2><p>Subjects are shared by all batches within the selected class.</p></div>
        @if (loading()) { <span class="loading"><i></i>Refreshing setup</span> }
      </div>
      <div class="class-grid" role="list" aria-label="Class levels">
        @for (level of classLevels; track level) {
          <button class="class-choice" [class.selected]="selectedClassLevel() === level" type="button" (click)="selectClass(level)" [attr.aria-pressed]="selectedClassLevel() === level">
            <strong>Class {{ level }}</strong><small>{{ classSummaryFor(level).subjectCount }} subjects / {{ classSummaryFor(level).batchCount }} batches</small>
          </button>
        }
      </div>
    </section>

    <section class="summary" aria-label="Selected class summary">
      <article class="metric indigo"><span>Selected class</span><strong>Class {{ selectedClassLevel() }}</strong><small>Matches the student class level</small></article>
      <article class="metric cyan"><span>Class subjects</span><strong>{{ currentSummary().subjectCount }}</strong><small>Available to every batch</small></article>
      <article class="metric violet"><span>Teaching batches</span><strong>{{ currentSummary().batchCount }}</strong><small>Morning, evening or custom groups</small></article>
    </section>

    <section class="routine-panel" aria-labelledby="routine-title">
      <header class="routine-head">
        <div>
          <p class="eyebrow">Weekly timetable</p>
          <h2 id="routine-title">Batch routine</h2>
          <p class="description">Choose a batch to see its recurring weekly subjects, times, and rooms. Routine entries are visual setup data and do not create attendance sessions automatically.</p>
        </div>
        @if (selectedRoutineBatch(); as batch) { <span class="tag">{{ batch.name }}</span> }
      </header>

      @if (!batches().length) {
        <p class="empty">Add and save a batch for Class {{ selectedClassLevel() }} before setting its routine.</p>
      } @else {
        <div class="batch-tabs" aria-label="Choose a batch routine">
          @for (batch of batches(); track batch.id) {
            <button class="batch-tab" [class.selected]="selectedRoutineBatchId() === batch.id" type="button" (click)="selectRoutineBatch(batch.id)" [attr.aria-pressed]="selectedRoutineBatchId() === batch.id">{{ batch.name }}</button>
          }
        </div>

        @if (routineLoading()) { <p class="empty"><span class="loading"><i></i>Loading {{ selectedRoutineBatch()?.name || 'batch' }} routine</span></p> }

        <div class="routine-board-wrap" [attr.aria-busy]="routineLoading()">
          <div class="routine-board" aria-label="Weekly batch timetable">
            @for (day of routineDays; track day.value) {
              <article class="routine-day">
                <header class="routine-day-head"><span>{{ day.label }}</span><small>{{ slotsForDay(day.value).length }} lesson{{ slotsForDay(day.value).length === 1 ? '' : 's' }}</small></header>
                @if (slotsForDay(day.value).length) {
                  <div class="routine-slots">
                    @for (slot of slotsForDay(day.value); track slot.id) {
                      <article class="routine-slot">
                        <span class="routine-time">{{ formatRoutineTime(slot.startTime) }} - {{ formatRoutineTime(slot.endTime) }}</span>
                        <strong class="record-title">{{ slot.subjectName }}</strong>
                        <span class="record-code">{{ slot.subjectCode }} / {{ slot.roomCode }}</span>
                        @if (slot.teacherName) { <span class="record-code">Teacher: {{ slot.teacherName }}</span> }
                        @if (canManage()) {
                          <div class="entry-actions"><button class="link-button" type="button" (click)="editRoutine(slot)" [disabled]="routineSaving()">Edit</button><button class="link-button danger" type="button" (click)="deleteRoutine(slot)" [disabled]="routineSaving()">Remove</button></div>
                        }
                      </article>
                    }
                  </div>
                } @else { <p class="empty">No class scheduled</p> }
              </article>
            }
          </div>
        </div>

        @if (canManage()) {
          @if (!subjects().length) {
            <p class="routine-read-only">Add and save at least one subject for Class {{ selectedClassLevel() }} before creating a routine slot.</p>
          } @else {
            <form class="entry" [formGroup]="routineForm" (ngSubmit)="saveRoutine()" novalidate>
              <h3>{{ editingRoutineId() ? 'Edit routine lesson' : 'Add a routine lesson' }}</h3>
              <div class="routine-fields">
                <div class="field"><label for="routine-subject">Subject</label><select id="routine-subject" formControlName="subjectId" [class.invalid]="routineInvalid('subjectId')"><option value="">Choose subject</option>@for (subject of subjects(); track subject.id) { <option [value]="subject.id">{{ subject.name }} ({{ subject.code }})</option> }</select>@if (routineInvalid('subjectId')) { <small class="field-error">Choose a subject.</small> }</div>
                <div class="field"><label for="routine-day">Day</label><select id="routine-day" formControlName="dayOfWeek" [class.invalid]="routineInvalid('dayOfWeek')">@for (day of routineDays; track day.value) { <option [ngValue]="day.value">{{ day.label }}</option> }</select></div>
                <div class="field"><label for="routine-start">Start</label><input id="routine-start" type="time" formControlName="startTime" [class.invalid]="routineInvalid('startTime')" />@if (routineInvalid('startTime')) { <small class="field-error">Enter a start time.</small> }</div>
                <div class="field"><label for="routine-end">End</label><input id="routine-end" type="time" formControlName="endTime" [class.invalid]="routineInvalid('endTime')" />@if (routineInvalid('endTime')) { <small class="field-error">Enter a later end time.</small> }</div>
                <div class="field"><label for="routine-room">Room</label><input id="routine-room" formControlName="roomCode" maxlength="60" placeholder="e.g. R-201" [class.invalid]="routineInvalid('roomCode')" />@if (routineInvalid('roomCode')) { <small class="field-error">Enter a room.</small> }</div>
                <div class="field"><label for="routine-teacher">Teacher <span>(optional)</span></label><input id="routine-teacher" formControlName="teacherName" maxlength="100" placeholder="e.g. Ayesha Rahman" [class.invalid]="routineInvalid('teacherName')" />@if (routineInvalid('teacherName')) { <small class="field-error">Teacher name must be 100 characters or fewer.</small> }</div>
              </div>
              <div class="entry-actions"><span class="hint">Times that overlap another lesson for this batch will be rejected.</span>@if (editingRoutineId() || routineForm.dirty) { <button class="secondary" type="button" (click)="cancelRoutineEdit()" [disabled]="routineSaving()">{{ editingRoutineId() ? 'Cancel' : 'Clear' }}</button> }<button class="primary" type="submit" [disabled]="routineSaving()">{{ routineSaving() ? 'Saving...' : editingRoutineId() ? 'Update lesson' : 'Add lesson' }}</button></div>
            </form>
          }
        } @else { <p class="routine-read-only">You can view the weekly routine. An administrator can add, edit, or remove routine lessons.</p> }
      }
    </section>

    <section class="setup-grid">
      <article class="panel" aria-labelledby="subjects-title">
        <header class="panel-head"><div><h2 id="subjects-title">Class {{ selectedClassLevel() }} subjects</h2><p>Subjects belong to the class, not to an individual batch.</p></div><span class="count">{{ subjects().length }} saved</span></header>
        @if (subjects().length) {
          <ul class="records">
            @for (subject of subjects(); track subject.id) { <li class="record"><span><strong class="record-title">{{ subject.name }}</strong><small class="record-code">{{ subject.code }}</small></span><span class="tag">Class {{ subject.classLevel }}</span></li> }
          </ul>
        } @else { <p class="empty">No subjects have been added for this class yet.</p> }
        @if (pendingSubjects().length) {
          <ul class="drafts" aria-label="Queued subjects">
            <li class="draft-label">Queued for one-click save ({{ pendingSubjects().length }})</li>
            @for (subject of pendingSubjects(); track subject.code; let index = $index) {
              <li class="draft"><span><strong class="record-title">{{ subject.name }}</strong><small class="record-code">{{ subject.code }}</small></span><span><span class="queued-tag">Not saved</span> <button class="remove" type="button" (click)="removeQueuedSubject(index)" [disabled]="saving()">Remove</button></span></li>
            }
          </ul>
        }
        @if (canManage()) {
          <form class="entry" [formGroup]="subjectForm" (ngSubmit)="queueSubject()" novalidate>
            <h3>Add a subject to the save list</h3>
            <div class="field-grid">
              <div class="field"><label for="subject-name">Subject name</label><input id="subject-name" formControlName="name" maxlength="120" placeholder="e.g. General Mathematics" [class.invalid]="subjectInvalid('name')" />@if (subjectInvalid('name')) { <small class="field-error">Enter a subject name.</small> }</div>
              <div class="field"><label for="subject-code">Code</label><input id="subject-code" formControlName="code" maxlength="32" placeholder="MATH-08" [class.invalid]="subjectInvalid('code')" />@if (subjectInvalid('code')) { <small class="field-error">Use letters, numbers, hyphens, or underscores only.</small> }</div>
            </div>
            <div class="entry-actions"><span class="hint">Queue all subjects, then save them once.</span><button class="primary" type="submit" [disabled]="saving()">Add to list</button></div>
          </form>
        } @else { <p class="read-only">You can view subjects. An administrator can add or change academic setup.</p> }
      </article>

      <article class="panel" aria-labelledby="batches-title">
        <header class="panel-head"><div><h2 id="batches-title">Class {{ selectedClassLevel() }} batches</h2><p>Use batches to organise multiple groups for the same class.</p></div><span class="count">{{ batches().length }} saved</span></header>
        @if (batches().length) {
          <ul class="records">
            @for (batch of batches(); track batch.id) { <li class="record"><span><strong class="record-title">{{ batch.name }}</strong><small class="record-code">{{ batch.code || 'No batch code' }}</small></span><span class="tag">Class {{ batch.classLevel }}</span></li> }
          </ul>
        } @else { <p class="empty">No batches have been added for this class yet.</p> }
        @if (pendingBatches().length) {
          <ul class="drafts" aria-label="Queued batches">
            <li class="draft-label">Queued for one-click save ({{ pendingBatches().length }})</li>
            @for (batch of pendingBatches(); track batch.name; let index = $index) {
              <li class="draft"><span><strong class="record-title">{{ batch.name }}</strong><small class="record-code">{{ batch.code || 'No batch code' }}</small></span><span><span class="queued-tag">Not saved</span> <button class="remove" type="button" (click)="removeQueuedBatch(index)" [disabled]="saving()">Remove</button></span></li>
            }
          </ul>
        }
        @if (canManage()) {
          <form class="entry" [formGroup]="batchForm" (ngSubmit)="queueBatch()" novalidate>
            <h3>Add a batch to the save list</h3>
            <div class="field-grid">
              <div class="field"><label for="batch-name">Batch name</label><input id="batch-name" formControlName="name" maxlength="100" placeholder="e.g. Morning batch" [class.invalid]="batchInvalid('name')" />@if (batchInvalid('name')) { <small class="field-error">Enter a batch name.</small> }</div>
              <div class="field"><label for="batch-code">Code <span>(optional)</span></label><input id="batch-code" formControlName="code" maxlength="32" placeholder="MOR-08" [class.invalid]="batchInvalid('code')" />@if (batchInvalid('code')) { <small class="field-error">Use letters, numbers, hyphens, or underscores only.</small> }</div>
            </div>
            <div class="entry-actions"><span class="hint">Several batches can belong to Class {{ selectedClassLevel() }}.</span><button class="primary" type="submit" [disabled]="saving()">Add to list</button></div>
          </form>
        } @else { <p class="read-only">You can view batches. An administrator can add or change academic setup.</p> }
      </article>
    </section>

    @if (canManage() && pendingItemCount()) {
      <section class="save-all" aria-live="polite">
        <div><strong>{{ pendingItemCount() }} item{{ pendingItemCount() === 1 ? '' : 's' }} ready to save</strong><p>{{ pendingSubjects().length }} subject{{ pendingSubjects().length === 1 ? '' : 's' }} and {{ pendingBatches().length }} batch{{ pendingBatches().length === 1 ? '' : 'es' }} will be added to Class {{ selectedClassLevel() }}.</p></div>
        <button class="primary" type="button" (click)="saveAll()" [disabled]="saving()">{{ saving() ? 'Saving all...' : 'Save all' }}</button>
      </section>
    }


  `,
})
export class AcademicPageComponent implements OnInit {
  private readonly api = inject(AcademicApi);
  private readonly auth = inject(AuthFacade);
  private readonly formBuilder = inject(FormBuilder);
  private loadVersion = 0;
  private routineLoadVersion = 0;

  readonly classLevels = Array.from({ length: 12 }, (_, index) => index + 1);
  readonly routineDays = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 7, label: 'Sunday' },
  ] as const;
  readonly selectedClassLevel = signal(1);
  readonly classSummaries = signal<AcademicClassSummary[]>(this.classLevels.map((classLevel) => ({ classLevel, subjectCount: 0, batchCount: 0 })));
  readonly subjects = signal<AcademicSubject[]>([]);
  readonly batches = signal<AcademicBatch[]>([]);
  readonly selectedRoutineBatchId = signal<string | null>(null);
  readonly routineEntries = signal<AcademicRoutineSlot[]>([]);
  readonly pendingSubjects = signal<AcademicSetupSubjectInput[]>([]);
  readonly pendingBatches = signal<AcademicSetupBatchInput[]>([]);
  readonly pendingItemCount = computed(() => this.pendingSubjects().length + this.pendingBatches().length);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly routineLoading = signal(false);
  readonly routineSaving = signal(false);
  readonly editingRoutineId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly canManage = computed(() => this.auth.session()?.user.role === 'Admin');
  readonly currentSummary = computed(() => this.classSummaryFor(this.selectedClassLevel()));
  readonly selectedRoutineBatch = computed(() => this.batches()
    .find((batch) => batch.id === this.selectedRoutineBatchId()) ?? null);
  readonly subjectForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(120)]],
    code: ['', [Validators.required, Validators.maxLength(32), Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
  });
  readonly batchForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    code: ['', [Validators.maxLength(32), Validators.pattern(/^$|^[A-Za-z0-9_-]+$/)]],
  });
  readonly routineForm = this.formBuilder.nonNullable.group({
    subjectId: ['', Validators.required],
    dayOfWeek: [1, [Validators.required, Validators.min(1), Validators.max(7)]],
    startTime: ['09:00', Validators.required],
    endTime: ['10:00', Validators.required],
    roomCode: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(60)]],
    teacherName: ['', Validators.maxLength(100)],
  });

  ngOnInit(): void {
    this.refresh();
  }

  selectClass(level: number): void {
    if (level === this.selectedClassLevel() || this.saving() || this.routineSaving()) {
      return;
    }

    if (this.pendingItemCount()) {
      this.clearFeedback();
      this.error.set(`Save or remove the ${this.pendingItemCount()} queued item${this.pendingItemCount() === 1 ? '' : 's'} before changing classes.`);
      return;
    }

    if (this.editingRoutineId() || this.routineForm.dirty) {
      this.clearFeedback();
      this.error.set('Save or cancel the routine lesson before changing classes.');
      return;
    }

    this.selectedClassLevel.set(level);
    this.subjects.set([]);
    this.batches.set([]);
    this.selectedRoutineBatchId.set(null);
    this.routineEntries.set([]);
    this.routineLoadVersion++;
    this.subjectForm.reset({ name: '', code: '' });
    this.batchForm.reset({ name: '', code: '' });
    this.resetRoutineForm();
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
        const selectedBatchId = this.selectedRoutineBatchId();
        const routineBatchId = selectedBatchId && batches.some((batch) => batch.id === selectedBatchId)
          ? selectedBatchId
          : batches[0]?.id ?? null;
        this.selectedRoutineBatchId.set(routineBatchId);
        if (routineBatchId) {
          this.loadRoutine(routineBatchId);
        } else {
          this.routineLoadVersion++;
          this.routineEntries.set([]);
          this.routineLoading.set(false);
        }
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

  queueSubject(): void {
    if (!this.canManage() || this.saving()) {
      return;
    }

    if (this.subjectForm.invalid) {
      this.subjectForm.markAllAsTouched();
      return;
    }

    const value = this.subjectForm.getRawValue();
    const subject: AcademicSetupSubjectInput = {
      name: normalizeName(value.name),
      code: normalizeCode(value.code),
    };

    if (this.subjectAlreadyExists(subject)) {
      this.clearFeedback();
      this.error.set('This subject name or code is already saved or queued for the selected class.');
      return;
    }

    this.pendingSubjects.update((items) => [...items, subject]);
    this.subjectForm.reset({ name: '', code: '' });
    this.clearFeedback();
  }

  queueBatch(): void {
    if (!this.canManage() || this.saving()) {
      return;
    }

    if (this.batchForm.invalid) {
      this.batchForm.markAllAsTouched();
      return;
    }

    const value = this.batchForm.getRawValue();
    const batch: AcademicSetupBatchInput = {
      name: normalizeName(value.name),
      code: normalizeCode(value.code) || null,
    };

    if (this.batchAlreadyExists(batch)) {
      this.clearFeedback();
      this.error.set('This batch name or code is already saved or queued for the selected class.');
      return;
    }

    this.pendingBatches.update((items) => [...items, batch]);
    this.batchForm.reset({ name: '', code: '' });
    this.clearFeedback();
  }

  removeQueuedSubject(index: number): void {
    if (!this.saving()) {
      this.pendingSubjects.update((items) => items.filter((_, itemIndex) => itemIndex !== index));
    }
  }

  removeQueuedBatch(index: number): void {
    if (!this.saving()) {
      this.pendingBatches.update((items) => items.filter((_, itemIndex) => itemIndex !== index));
    }
  }

  saveAll(): void {
    if (!this.canManage() || this.saving() || !this.pendingItemCount()) {
      return;
    }

    const subjects = this.pendingSubjects();
    const batches = this.pendingBatches();
    const classLevel = this.selectedClassLevel();
    this.saving.set(true);
    this.clearFeedback();
    this.api.saveSetup({ classLevel, subjects, batches }).subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.pendingSubjects.set([]);
        this.pendingBatches.set([]);
        const count = saved.subjects.length + saved.batches.length;
        this.success.set(`${count} academic setup item${count === 1 ? ' was' : 's were'} saved to Class ${classLevel}.`);
        this.refresh();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(readApiError(error, 'Unable to save the queued academic setup. Your queued items are still available to retry.'));
      },
    });
  }

  selectRoutineBatch(batchId: string): void {
    if (batchId === this.selectedRoutineBatchId() || this.routineSaving()) {
      return;
    }

    if (this.editingRoutineId() || this.routineForm.dirty) {
      this.clearFeedback();
      this.error.set('Save or cancel the routine lesson before changing batches.');
      return;
    }

    this.selectedRoutineBatchId.set(batchId);
    this.routineEntries.set([]);
    this.clearFeedback();
    this.loadRoutine(batchId);
  }

  saveRoutine(): void {
    if (!this.canManage() || this.routineSaving()) {
      return;
    }

    const batchId = this.selectedRoutineBatchId();
    if (!batchId) {
      this.error.set('Choose a batch before adding a routine lesson.');
      return;
    }

    if (this.routineForm.invalid) {
      this.routineForm.markAllAsTouched();
      return;
    }

    const value = this.routineForm.getRawValue();
    if (value.endTime <= value.startTime) {
      this.routineForm.controls.endTime.setErrors({ timeRange: true });
      this.routineForm.controls.endTime.markAsTouched();
      return;
    }

    const request = {
      batchId,
      subjectId: value.subjectId,
      dayOfWeek: value.dayOfWeek,
      startTime: value.startTime,
      endTime: value.endTime,
      roomCode: normalizeName(value.roomCode),
      teacherName: normalizeName(value.teacherName) || null,
    };
    const editingId = this.editingRoutineId();
    this.routineSaving.set(true);
    this.clearFeedback();
    const action = editingId
      ? this.api.updateRoutine(editingId, request)
      : this.api.createRoutine(request);

    action.subscribe({
      next: () => {
        this.routineSaving.set(false);
        this.resetRoutineForm();
        this.success.set(editingId ? 'Routine lesson updated.' : 'Routine lesson added.');
        this.loadRoutine(batchId);
      },
      error: (error: unknown) => {
        this.routineSaving.set(false);
        this.error.set(readApiError(error, 'Unable to save this routine lesson.'));
      },
    });
  }

  editRoutine(slot: AcademicRoutineSlot): void {
    if (!this.canManage() || this.routineSaving()) {
      return;
    }

    this.editingRoutineId.set(slot.id);
    this.routineForm.reset({
      subjectId: slot.subjectId,
      dayOfWeek: slot.dayOfWeek,
      startTime: timeForInput(slot.startTime),
      endTime: timeForInput(slot.endTime),
      roomCode: slot.roomCode,
      teacherName: slot.teacherName ?? '',
    });
    this.routineForm.markAsPristine();
    this.routineForm.markAsUntouched();
    this.clearFeedback();
  }

  cancelRoutineEdit(): void {
    if (!this.routineSaving()) {
      this.resetRoutineForm();
      this.clearFeedback();
    }
  }

  deleteRoutine(slot: AcademicRoutineSlot): void {
    if (!this.canManage() || this.routineSaving()) {
      return;
    }

    if (!window.confirm(`Remove ${slot.subjectName} from this batch routine?`)) {
      return;
    }

    this.routineSaving.set(true);
    this.clearFeedback();
    this.api.deleteRoutine(slot.id).subscribe({
      next: () => {
        this.routineSaving.set(false);
        if (this.editingRoutineId() === slot.id) {
          this.resetRoutineForm();
        }
        this.success.set('Routine lesson removed.');
        const batchId = this.selectedRoutineBatchId();
        if (batchId) {
          this.loadRoutine(batchId);
        }
      },
      error: (error: unknown) => {
        this.routineSaving.set(false);
        this.error.set(readApiError(error, 'Unable to remove this routine lesson.'));
      },
    });
  }

  slotsForDay(dayOfWeek: number): AcademicRoutineSlot[] {
    return this.routineEntries().filter((slot) => slot.dayOfWeek === dayOfWeek);
  }

  formatRoutineTime(time: string): string {
    return timeForInput(time);
  }

  routineInvalid(name: 'subjectId' | 'dayOfWeek' | 'startTime' | 'endTime' | 'roomCode' | 'teacherName'): boolean {
    const control = this.routineForm.controls[name];
    return control.invalid && (control.dirty || control.touched);
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

  private loadRoutine(batchId: string): void {
    const version = ++this.routineLoadVersion;
    this.routineLoading.set(true);
    this.api.routines(batchId).subscribe({
      next: (slots) => {
        if (version !== this.routineLoadVersion || batchId !== this.selectedRoutineBatchId()) {
          return;
        }

        this.routineEntries.set(slots);
        this.routineLoading.set(false);
      },
      error: (error: unknown) => {
        if (version !== this.routineLoadVersion || batchId !== this.selectedRoutineBatchId()) {
          return;
        }

        this.routineLoading.set(false);
        this.error.set(readApiError(error, 'Unable to load this batch routine.'));
      },
    });
  }

  private resetRoutineForm(): void {
    this.editingRoutineId.set(null);
    this.routineForm.reset({
      subjectId: '',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:00',
      roomCode: '',
      teacherName: '',
    });
    this.routineForm.markAsPristine();
    this.routineForm.markAsUntouched();
  }

  private subjectAlreadyExists(candidate: AcademicSetupSubjectInput): boolean {
    return [...this.subjects(), ...this.pendingSubjects()].some((subject) =>
      nameKey(subject.name) === nameKey(candidate.name)
      || normalizeCode(subject.code) === candidate.code);
  }

  private batchAlreadyExists(candidate: AcademicSetupBatchInput): boolean {
    return [...this.batches(), ...this.pendingBatches()].some((batch) =>
      nameKey(batch.name) === nameKey(candidate.name)
      || (candidate.code !== null && batch.code !== null && normalizeCode(batch.code) === candidate.code));
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

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function nameKey(value: string): string {
  return normalizeName(value).toUpperCase();
}

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function timeForInput(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value;
}
