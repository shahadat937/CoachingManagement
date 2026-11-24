import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { I18nService } from '../../../core/i18n/i18n.service';
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
        <p class="eyebrow">{{ i18n.t('academic.eyebrow') }}</p>
        <h1>{{ i18n.t('academic.title') }}</h1>
        <p class="description">{{ i18n.t('academic.description') }}</p>
      </div>
      <div class="class-caption">{{ i18n.t('academic.classSelected', { classLevel: selectedClassLevel() }) }}</div>
    </section>

    @if (success(); as message) { <div class="notice success" role="status"><span>{{ message }}</span><button type="button" (click)="clearFeedback()" [attr.aria-label]="i18n.t('academic.dismissSuccess')">{{ i18n.t('academic.close') }}</button></div> }
    @if (error(); as message) { <div class="notice error" role="alert"><span>{{ message }}</span><button type="button" (click)="clearFeedback()" [attr.aria-label]="i18n.t('academic.dismissError')">{{ i18n.t('academic.close') }}</button></div> }

    <section class="class-picker" aria-labelledby="class-picker-title">
      <div class="class-picker-head">
        <div><h2 id="class-picker-title">{{ i18n.t('academic.chooseClass') }}</h2><p>{{ i18n.t('academic.classPickerDescription') }}</p></div>
        @if (loading()) { <span class="loading"><i></i>{{ i18n.t('academic.refreshingSetup') }}</span> }
      </div>
      <div class="class-grid" role="list" [attr.aria-label]="i18n.t('academic.classLevels')">
        @for (level of classLevels; track level) {
          <button class="class-choice" [class.selected]="selectedClassLevel() === level" type="button" (click)="selectClass(level)" [attr.aria-pressed]="selectedClassLevel() === level">
            <strong>{{ classLabel(level) }}</strong><small>{{ classSummaryLabel(level) }}</small>
          </button>
        }
      </div>
    </section>

    <section class="summary" [attr.aria-label]="i18n.t('academic.selectedClassSummary')">
      <article class="metric indigo"><span>{{ i18n.t('academic.selectedClass') }}</span><strong>{{ classLabel(selectedClassLevel()) }}</strong><small>{{ i18n.t('academic.matchesStudentClass') }}</small></article>
      <article class="metric cyan"><span>{{ i18n.t('academic.classSubjects') }}</span><strong>{{ currentSummary().subjectCount }}</strong><small>{{ i18n.t('academic.availableToEveryBatch') }}</small></article>
      <article class="metric violet"><span>{{ i18n.t('academic.teachingBatches') }}</span><strong>{{ currentSummary().batchCount }}</strong><small>{{ i18n.t('academic.groupsDescription') }}</small></article>
    </section>

    <section class="routine-panel" aria-labelledby="routine-title">
      <header class="routine-head">
        <div>
          <p class="eyebrow">{{ i18n.t('academic.weeklyTimetable') }}</p>
          <h2 id="routine-title">{{ i18n.t('academic.batchRoutine') }}</h2>
          <p class="description">{{ i18n.t('academic.routineDescription') }}</p>
        </div>
        @if (selectedRoutineBatch(); as batch) { <span class="tag">{{ batch.name }}</span> }
      </header>

      @if (!batches().length) {
        <p class="empty">{{ i18n.t('academic.addBatchBeforeRoutine', { classLabel: classLabel(selectedClassLevel()) }) }}</p>
      } @else {
        <div class="batch-tabs" [attr.aria-label]="i18n.t('academic.chooseRoutine')">
          @for (batch of batches(); track batch.id) {
            <button class="batch-tab" [class.selected]="selectedRoutineBatchId() === batch.id" type="button" (click)="selectRoutineBatch(batch.id)" [attr.aria-pressed]="selectedRoutineBatchId() === batch.id">{{ batch.name }}</button>
          }
        </div>

        @if (routineLoading()) { <p class="empty"><span class="loading"><i></i>{{ loadingRoutineLabel() }}</span></p> }

        <div class="routine-board-wrap" [attr.aria-busy]="routineLoading()">
          <div class="routine-board" [attr.aria-label]="i18n.t('academic.weeklyBatchTimetable')">
            @for (day of routineDays; track day.value) {
              <article class="routine-day">
                <header class="routine-day-head"><span>{{ routineDayLabel(day.value) }}</span><small>{{ lessonLabel(slotsForDay(day.value).length) }}</small></header>
                @if (slotsForDay(day.value).length) {
                  <div class="routine-slots">
                    @for (slot of slotsForDay(day.value); track slot.id) {
                      <article class="routine-slot">
                        <span class="routine-time">{{ formatRoutineTime(slot.startTime) }} - {{ formatRoutineTime(slot.endTime) }}</span>
                        <strong class="record-title">{{ slot.subjectName }}</strong>
                        <span class="record-code">{{ slot.subjectCode }} / {{ slot.roomCode }}</span>
                        @if (slot.teacherName) { <span class="record-code">{{ i18n.t('academic.teacher') }}: {{ slot.teacherName }}</span> }
                        @if (canManage()) {
                          <div class="entry-actions"><button class="link-button" type="button" (click)="editRoutine(slot)" [disabled]="routineSaving()">{{ i18n.t('academic.edit') }}</button><button class="link-button danger" type="button" (click)="deleteRoutine(slot)" [disabled]="routineSaving()">{{ i18n.t('academic.remove') }}</button></div>
                        }
                      </article>
                    }
                  </div>
                } @else { <p class="empty">{{ i18n.t('academic.noClassScheduled') }}</p> }
              </article>
            }
          </div>
        </div>

        @if (canManage()) {
          @if (!subjects().length) {
            <p class="routine-read-only">{{ i18n.t('academic.addSubjectBeforeRoutine', { classLabel: classLabel(selectedClassLevel()) }) }}</p>
          } @else {
            <form class="entry" [formGroup]="routineForm" (ngSubmit)="saveRoutine()" novalidate>
              <h3>{{ editingRoutineId() ? i18n.t('academic.editRoutineLesson') : i18n.t('academic.addRoutineLesson') }}</h3>
              <div class="routine-fields">
                <div class="field"><label for="routine-subject">{{ i18n.t('academic.subject') }}</label><select id="routine-subject" formControlName="subjectId" [class.invalid]="routineInvalid('subjectId')"><option value="">{{ i18n.t('academic.chooseSubject') }}</option>@for (subject of subjects(); track subject.id) { <option [value]="subject.id">{{ subject.name }} ({{ subject.code }})</option> }</select>@if (routineInvalid('subjectId')) { <small class="field-error">{{ i18n.t('academic.subjectRequired') }}</small> }</div>
                <div class="field"><label for="routine-day">{{ i18n.t('academic.day') }}</label><select id="routine-day" formControlName="dayOfWeek" [class.invalid]="routineInvalid('dayOfWeek')">@for (day of routineDays; track day.value) { <option [ngValue]="day.value">{{ routineDayLabel(day.value) }}</option> }</select></div>
                <div class="field"><label for="routine-start">{{ i18n.t('academic.start') }}</label><input id="routine-start" type="time" formControlName="startTime" [class.invalid]="routineInvalid('startTime')" />@if (routineInvalid('startTime')) { <small class="field-error">{{ i18n.t('academic.startRequired') }}</small> }</div>
                <div class="field"><label for="routine-end">{{ i18n.t('academic.end') }}</label><input id="routine-end" type="time" formControlName="endTime" [class.invalid]="routineInvalid('endTime')" />@if (routineInvalid('endTime')) { <small class="field-error">{{ i18n.t('academic.endRequired') }}</small> }</div>
                <div class="field"><label for="routine-room">{{ i18n.t('academic.room') }}</label><input id="routine-room" formControlName="roomCode" maxlength="60" [placeholder]="i18n.t('academic.roomPlaceholder')" [class.invalid]="routineInvalid('roomCode')" />@if (routineInvalid('roomCode')) { <small class="field-error">{{ i18n.t('academic.roomRequired') }}</small> }</div>
                <div class="field"><label for="routine-teacher">{{ i18n.t('academic.teacher') }} <span>{{ i18n.t('academic.optional') }}</span></label><input id="routine-teacher" formControlName="teacherName" maxlength="100" [placeholder]="i18n.t('academic.teacherPlaceholder')" [class.invalid]="routineInvalid('teacherName')" />@if (routineInvalid('teacherName')) { <small class="field-error">{{ i18n.t('academic.teacherLength') }}</small> }</div>
              </div>
              <div class="entry-actions"><span class="hint">{{ i18n.t('academic.overlapWarning') }}</span>@if (editingRoutineId() || routineForm.dirty) { <button class="secondary" type="button" (click)="cancelRoutineEdit()" [disabled]="routineSaving()">{{ editingRoutineId() ? i18n.t('academic.cancel') : i18n.t('academic.clear') }}</button> }<button class="primary" type="submit" [disabled]="routineSaving()">{{ routineSaving() ? i18n.t('academic.saving') : editingRoutineId() ? i18n.t('academic.updateLesson') : i18n.t('academic.addLesson') }}</button></div>
            </form>
          }
        } @else { <p class="routine-read-only">{{ i18n.t('academic.routineReadOnly') }}</p> }
      }
    </section>

    <section class="setup-grid">
      <article class="panel" aria-labelledby="subjects-title">
        <header class="panel-head"><div><h2 id="subjects-title">{{ i18n.t('academic.subjectsTitle', { classLabel: classLabel(selectedClassLevel()) }) }}</h2><p>{{ i18n.t('academic.subjectsDescription') }}</p></div><span class="count">{{ i18n.t('academic.savedCount', { count: subjects().length }) }}</span></header>
        @if (subjects().length) {
          <ul class="records">
            @for (subject of subjects(); track subject.id) { <li class="record"><span><strong class="record-title">{{ subject.name }}</strong><small class="record-code">{{ subject.code }}</small></span><span class="tag">{{ classLabel(subject.classLevel) }}</span></li> }
          </ul>
        } @else { <p class="empty">{{ i18n.t('academic.noSubjects') }}</p> }
        @if (pendingSubjects().length) {
          <ul class="drafts" [attr.aria-label]="i18n.t('academic.queuedSubjects')">
            <li class="draft-label">{{ i18n.t('academic.queuedForSave', { count: pendingSubjects().length }) }}</li>
            @for (subject of pendingSubjects(); track subject.code; let index = $index) {
              <li class="draft"><span><strong class="record-title">{{ subject.name }}</strong><small class="record-code">{{ subject.code }}</small></span><span><span class="queued-tag">{{ i18n.t('academic.notSaved') }}</span> <button class="remove" type="button" (click)="removeQueuedSubject(index)" [disabled]="saving()">{{ i18n.t('academic.remove') }}</button></span></li>
            }
          </ul>
        }
        @if (canManage()) {
          <form class="entry" [formGroup]="subjectForm" (ngSubmit)="queueSubject()" novalidate>
            <h3>{{ i18n.t('academic.addSubjectToList') }}</h3>
            <div class="field-grid">
              <div class="field"><label for="subject-name">{{ i18n.t('academic.subjectName') }}</label><input id="subject-name" formControlName="name" maxlength="120" [placeholder]="i18n.t('academic.subjectPlaceholder')" [class.invalid]="subjectInvalid('name')" />@if (subjectInvalid('name')) { <small class="field-error">{{ i18n.t('academic.subjectNameRequired') }}</small> }</div>
              <div class="field"><label for="subject-code">{{ i18n.t('academic.code') }}</label><input id="subject-code" formControlName="code" maxlength="32" placeholder="MATH-08" [class.invalid]="subjectInvalid('code')" />@if (subjectInvalid('code')) { <small class="field-error">{{ i18n.t('academic.codeSyntax') }}</small> }</div>
            </div>
            <div class="entry-actions"><span class="hint">{{ i18n.t('academic.queueSubjectsHint') }}</span><button class="primary" type="submit" [disabled]="saving()">{{ i18n.t('academic.addToList') }}</button></div>
          </form>
        } @else { <p class="read-only">{{ i18n.t('academic.subjectsReadOnly') }}</p> }
      </article>

      <article class="panel" aria-labelledby="batches-title">
        <header class="panel-head"><div><h2 id="batches-title">{{ i18n.t('academic.batchesTitle', { classLabel: classLabel(selectedClassLevel()) }) }}</h2><p>{{ i18n.t('academic.batchesDescription') }}</p></div><span class="count">{{ i18n.t('academic.savedCount', { count: batches().length }) }}</span></header>
        @if (batches().length) {
          <ul class="records">
            @for (batch of batches(); track batch.id) { <li class="record"><span><strong class="record-title">{{ batch.name }}</strong><small class="record-code">{{ batch.code || i18n.t('academic.noBatchCode') }}</small></span><span class="tag">{{ classLabel(batch.classLevel) }}</span></li> }
          </ul>
        } @else { <p class="empty">{{ i18n.t('academic.noBatches') }}</p> }
        @if (pendingBatches().length) {
          <ul class="drafts" [attr.aria-label]="i18n.t('academic.queuedBatches')">
            <li class="draft-label">{{ i18n.t('academic.queuedForSave', { count: pendingBatches().length }) }}</li>
            @for (batch of pendingBatches(); track batch.name; let index = $index) {
              <li class="draft"><span><strong class="record-title">{{ batch.name }}</strong><small class="record-code">{{ batch.code || i18n.t('academic.noBatchCode') }}</small></span><span><span class="queued-tag">{{ i18n.t('academic.notSaved') }}</span> <button class="remove" type="button" (click)="removeQueuedBatch(index)" [disabled]="saving()">{{ i18n.t('academic.remove') }}</button></span></li>
            }
          </ul>
        }
        @if (canManage()) {
          <form class="entry" [formGroup]="batchForm" (ngSubmit)="queueBatch()" novalidate>
            <h3>{{ i18n.t('academic.addBatchToList') }}</h3>
            <div class="field-grid">
              <div class="field"><label for="batch-name">{{ i18n.t('academic.batchName') }}</label><input id="batch-name" formControlName="name" maxlength="100" [placeholder]="i18n.t('academic.batchPlaceholder')" [class.invalid]="batchInvalid('name')" />@if (batchInvalid('name')) { <small class="field-error">{{ i18n.t('academic.batchNameRequired') }}</small> }</div>
              <div class="field"><label for="batch-code">{{ i18n.t('academic.batchCode') }} <span>{{ i18n.t('academic.optional') }}</span></label><input id="batch-code" formControlName="code" maxlength="32" placeholder="MOR-08" [class.invalid]="batchInvalid('code')" />@if (batchInvalid('code')) { <small class="field-error">{{ i18n.t('academic.codeSyntax') }}</small> }</div>
            </div>
            <div class="entry-actions"><span class="hint">{{ i18n.t('academic.batchesHint', { classLabel: classLabel(selectedClassLevel()) }) }}</span><button class="primary" type="submit" [disabled]="saving()">{{ i18n.t('academic.addToList') }}</button></div>
          </form>
        } @else { <p class="read-only">{{ i18n.t('academic.batchesReadOnly') }}</p> }
      </article>
    </section>

    @if (canManage() && pendingItemCount()) {
      <section class="save-all" aria-live="polite">
        <div><strong>{{ itemsReadyLabel() }}</strong><p>{{ itemsWillBeAddedLabel() }}</p></div>
        <button class="primary" type="button" (click)="saveAll()" [disabled]="saving()">{{ saving() ? i18n.t('academic.savingAll') : i18n.t('academic.saveAll') }}</button>
      </section>
    }
  `,
})
export class AcademicPageComponent implements OnInit {
  private readonly api = inject(AcademicApi);
  private readonly auth = inject(AuthFacade);
  private readonly formBuilder = inject(FormBuilder);
  readonly i18n = inject(I18nService);
  private loadVersion = 0;
  private routineLoadVersion = 0;

  readonly classLevels = Array.from({ length: 12 }, (_, index) => index + 1);
  readonly routineDays = [
    { value: 1 },
    { value: 2 },
    { value: 3 },
    { value: 4 },
    { value: 5 },
    { value: 6 },
    { value: 7 },
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
      const count = this.pendingItemCount();
      const items = this.i18n.t(
        count === 1 ? 'academic.error.queuedItemOne' : 'academic.error.queuedItemOther',
        { count },
      );
      this.error.set(this.i18n.t('academic.error.saveOrRemoveQueued', { items }));
      return;
    }

    if (this.editingRoutineId() || this.routineForm.dirty) {
      this.clearFeedback();
      this.error.set(this.i18n.t('academic.error.saveOrCancelBeforeClass'));
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
        this.error.set(this.apiError(error, 'academic.error.unableLoadSetup'));
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
      this.error.set(this.i18n.t('academic.error.duplicateSubject'));
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
      this.error.set(this.i18n.t('academic.error.duplicateBatch'));
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
        this.success.set(this.i18n.t(
          count === 1 ? 'academic.success.savedOne' : 'academic.success.savedOther',
          { count, classLabel: this.classLabel(classLevel) },
        ));
        this.refresh();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(this.apiError(error, 'academic.error.unableSaveSetup'));
      },
    });
  }

  selectRoutineBatch(batchId: string): void {
    if (batchId === this.selectedRoutineBatchId() || this.routineSaving()) {
      return;
    }

    if (this.editingRoutineId() || this.routineForm.dirty) {
      this.clearFeedback();
      this.error.set(this.i18n.t('academic.error.saveOrCancelBeforeBatch'));
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
      this.error.set(this.i18n.t('academic.error.chooseBatch'));
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
        this.success.set(this.i18n.t(editingId ? 'academic.success.routineUpdated' : 'academic.success.routineAdded'));
        this.loadRoutine(batchId);
      },
      error: (error: unknown) => {
        this.routineSaving.set(false);
        this.error.set(this.apiError(error, 'academic.error.unableSaveRoutine'));
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

    if (!window.confirm(this.i18n.t('academic.confirmRemoveRoutine', { subjectName: slot.subjectName }))) {
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
        this.success.set(this.i18n.t('academic.success.routineRemoved'));
        const batchId = this.selectedRoutineBatchId();
        if (batchId) {
          this.loadRoutine(batchId);
        }
      },
      error: (error: unknown) => {
        this.routineSaving.set(false);
        this.error.set(this.apiError(error, 'academic.error.unableRemoveRoutine'));
      },
    });
  }

  slotsForDay(dayOfWeek: number): AcademicRoutineSlot[] {
    return this.routineEntries().filter((slot) => slot.dayOfWeek === dayOfWeek);
  }

  formatRoutineTime(time: string): string {
    return timeForInput(time);
  }

  classLabel(level: number): string {
    return this.i18n.t('academic.classLabel', { classLevel: level });
  }

  classSummaryLabel(level: number): string {
    const summary = this.classSummaryFor(level);
    return this.i18n.t('academic.classSummary', {
      subjectCount: summary.subjectCount,
      batchCount: summary.batchCount,
    });
  }

  routineDayLabel(dayOfWeek: number): string {
    return this.i18n.t(ROUTINE_DAY_KEYS[dayOfWeek] ?? 'academic.day.monday');
  }

  lessonLabel(count: number): string {
    return this.i18n.t(count === 1 ? 'academic.lessonOne' : 'academic.lessonOther', { count });
  }

  loadingRoutineLabel(): string {
    return this.i18n.t('academic.loadingRoutine', {
      batchName: this.selectedRoutineBatch()?.name || this.i18n.t('academic.batch'),
    });
  }

  itemsReadyLabel(): string {
    const count = this.pendingItemCount();
    return this.i18n.t(count === 1 ? 'academic.itemsReadyOne' : 'academic.itemsReadyOther', { count });
  }

  itemsWillBeAddedLabel(): string {
    return this.i18n.t('academic.itemsWillBeAdded', {
      subjectCount: this.pendingSubjects().length,
      batchCount: this.pendingBatches().length,
      classLabel: this.classLabel(this.selectedClassLevel()),
    });
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
        this.error.set(this.apiError(error, 'academic.error.unableLoadRoutine'));
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

  private apiError(error: unknown, fallbackKey: string): string {
    const message = readApiError(
      error,
      this.i18n.t(fallbackKey),
      this.i18n.t('academic.error.serviceUnreachable'),
    );
    return this.i18n.errorMessage(message);
  }
}

const ROUTINE_DAY_KEYS: Readonly<Record<number, string>> = {
  1: 'academic.day.monday',
  2: 'academic.day.tuesday',
  3: 'academic.day.wednesday',
  4: 'academic.day.thursday',
  5: 'academic.day.friday',
  6: 'academic.day.saturday',
  7: 'academic.day.sunday',
};

function readApiError(error: unknown, fallback: string, unavailable: string): string {
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

  return error.status === 0 ? unavailable : fallback;
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
