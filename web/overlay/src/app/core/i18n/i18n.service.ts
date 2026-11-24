import { Injectable, computed, signal } from '@angular/core';
import { APP_TRANSLATIONS } from './i18n.translations';
import type { TranslationCatalogue } from './i18n.translations';

export type AppLanguage = 'en' | 'bn';

export interface TranslationParams {
  [name: string]: string | number;
}

const LANGUAGE_STORAGE_KEY = 'coaching-hub.language';

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly language = signal<AppLanguage>(this.readStoredLanguage());
  readonly locale = computed(() => this.language() === 'bn' ? 'bn-BD' : 'en-BD');

  constructor() {
    this.applyDocumentLanguage(this.language());
  }

  setLanguage(language: AppLanguage): void {
    this.language.set(language);
    this.writeStoredLanguage(language);
    this.applyDocumentLanguage(language);
  }

  t(key: string, params?: TranslationParams): string {
    const translation = this.lookup(APP_TRANSLATIONS, this.language(), key)
      ?? this.lookup(APP_TRANSLATIONS, 'en', key)
      ?? key;

    return this.interpolate(translation, params);
  }

  /**
   * API services currently return English details. Keep their detail in English,
   * while Bengali users receive an understandable localized fallback if the text
   * has not been mapped yet.
   */
  errorMessage(message: string | null | undefined, fallbackKey = 'common.requestFailed'): string {
    const normalized = message?.trim();
    if (!normalized) {
      return this.t(fallbackKey);
    }

    if (this.language() === 'en') {
      return normalized;
    }

    const mappedKey = apiErrorKeys[normalized.toLocaleLowerCase()];
    return mappedKey ? this.t(mappedKey) : this.t(fallbackKey);
  }

  formatDate(value: Date | string | number, options: Intl.DateTimeFormatOptions = {}): string {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : new Intl.DateTimeFormat(this.locale(), options).format(date);
  }

  formatNumber(value: number, options: Intl.NumberFormatOptions = {}): string {
    return new Intl.NumberFormat(this.locale(), options).format(value);
  }

  formatCurrency(value: number, currency = 'BDT'): string {
    return new Intl.NumberFormat(this.locale(), {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatClassLevel(level: number | string | null | undefined): string {
    if (level === null || level === undefined || level === '') {
      return this.t('common.notAvailable');
    }

    return this.t('common.classLevel', { level: this.formatNumber(Number(level)) });
  }

  displayValue(value: string): string {
    const classMatch = /^Class\s+(\d+)$/i.exec(value);
    if (classMatch) {
      return this.formatClassLevel(classMatch[1]);
    }

    const key = displayValueKeys[value];
    return key ? this.t(key) : value;
  }

  private readStoredLanguage(): AppLanguage {
    if (typeof localStorage === 'undefined') {
      return 'en';
    }

    try {
      return localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'bn' ? 'bn' : 'en';
    } catch {
      return 'en';
    }
  }

  private writeStoredLanguage(language: AppLanguage): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Language selection still works for this session when storage is blocked.
    }
  }

  private applyDocumentLanguage(language: AppLanguage): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.lang = language === 'bn' ? 'bn' : 'en';
    document.documentElement.dir = 'ltr';
    document.title = this.lookup(APP_TRANSLATIONS, language, 'app.title')
      ?? this.lookup(APP_TRANSLATIONS, 'en', 'app.title')
      ?? document.title;
  }

  private lookup(catalogue: TranslationCatalogue, language: AppLanguage, key: string): string | undefined {
    return catalogue[language][key];
  }

  private interpolate(value: string, params?: TranslationParams): string {
    if (!params) {
      return value;
    }

    return value.replace(/\{\{?(\w+)\}?\}/g, (placeholder, name: string) =>
      Object.hasOwn(params, name) ? String(params[name]) : placeholder);
  }
}

const apiErrorKeys: Record<string, string> = {
  'network error': 'errors.network',
  'unable to load students.': 'errors.loadStudents',
  'unable to load academic setup.': 'errors.loadAcademicSetup',
  'unable to load attendance records.': 'errors.loadAttendance',
};

const displayValueKeys: Record<string, string> = {
  Active: 'status.active',
  Pending: 'status.pending',
  Published: 'status.published',
  'Review needed': 'status.reviewNeeded',
  'In progress': 'status.inProgress',
  Upcoming: 'status.upcoming',
  Scheduled: 'status.scheduled',
  Draft: 'status.draft',
  'Marks pending': 'status.marksPending',
  Paid: 'status.paid',
  'Due soon': 'status.dueSoon',
  Outstanding: 'status.outstanding',
  Partial: 'status.partial',
  Online: 'status.online',
  Offline: 'status.offline',
  'Check-in needed': 'status.checkInNeeded',
  Teacher: 'roles.Teacher',
  Accountant: 'roles.Accountant',
};
