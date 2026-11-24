import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    localStorage.removeItem('coaching-hub.language');
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.removeItem('coaching-hub.language'));

  it('uses English by default and interpolates values', () => {
    service = TestBed.inject(I18nService);

    expect(service.language()).toBe('en');
    expect(service.t('common.classLevel', { level: 8 })).toBe('Class 8');
  });

  it('switches to Bangla, updates the document language, and persists the choice', () => {
    service = TestBed.inject(I18nService);
    service.setLanguage('bn');

    expect(service.t('nav.students')).toBe('শিক্ষার্থী');
    expect(document.documentElement.lang).toBe('bn');
    expect(localStorage.getItem('coaching-hub.language')).toBe('bn');
  });

  it('restores the saved Bangla preference for a new application session', () => {
    localStorage.setItem('coaching-hub.language', 'bn');
    service = TestBed.inject(I18nService);

    expect(service.language()).toBe('bn');
  });
});
