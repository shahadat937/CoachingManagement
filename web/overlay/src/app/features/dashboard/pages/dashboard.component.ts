import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { I18nService } from '../../../core/i18n/i18n.service';
import { APP_NAVIGATION, hasRole, ModuleCard } from '../../../core/navigation/navigation';

interface ScheduleItem {
  time: string;
  titleKey: string;
  detailKey: string;
  stateKey: string;
  tone: 'indigo' | 'cyan' | 'orange';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .hero { align-items: end; display: flex; gap: 1.5rem; justify-content: space-between; margin: .3rem 0 1.7rem; }
    .eyebrow { color: #7169eb; font-size: .72rem; font-weight: 800; letter-spacing: .09em; margin: 0 0 .48rem; text-transform: uppercase; }
    h1 { color: #162945; font-size: clamp(1.55rem, 3vw, 2.25rem); letter-spacing: -.045em; line-height: 1.08; margin: 0; }
    .hero p:not(.eyebrow) { color: #6e7e97; font-size: .95rem; margin: .55rem 0 0; max-width: 38rem; }
    .primary-action { align-items: center; background: #6159e9; border-radius: .72rem; box-shadow: 0 10px 22px rgba(91, 80, 224, .22); color: #fff; display: inline-flex; font-size: .83rem; font-weight: 750; gap: .45rem; padding: .78rem 1rem; text-decoration: none; white-space: nowrap; }
    .primary-action span { font-size: 1.1rem; line-height: .7; }
    .restriction { background: #fff5e9; border: 1px solid #ffe0b6; border-radius: .75rem; color: #9a632f; font-size: .78rem; margin: 0 0 1rem; padding: .75rem .85rem; }
    .metrics { display: grid; gap: 1rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .metric { background: #fff; border: 1px solid #e8edf6; border-radius: 1rem; overflow: hidden; padding: 1.1rem; position: relative; }
    .metric::after { background: var(--tone); border-radius: 1rem; content: ''; height: .25rem; left: 1rem; opacity: .85; position: absolute; top: 0; width: 2.8rem; }
    .metric.indigo { --tone: #6259e9; } .metric.cyan { --tone: #21b3d5; } .metric.violet { --tone: #9b6eea; } .metric.orange { --tone: #f29a5f; }
    .metric-label { color: #70809a; display: block; font-size: .76rem; font-weight: 700; }
    .metric strong { color: #213551; display: block; font-size: 1.5rem; letter-spacing: -.04em; margin: .6rem 0 .25rem; }
    .metric small { color: #8795ab; font-size: .72rem; }
    .metric small b { color: #1ca479; font-weight: 750; }
    .grid { display: grid; gap: 1rem; grid-template-columns: minmax(0, 1.5fr) minmax(17rem, .85fr); margin-top: 1rem; }
    .panel { background: #fff; border: 1px solid #e8edf6; border-radius: 1rem; padding: 1.2rem; }
    .panel-head { align-items: center; display: flex; justify-content: space-between; margin-bottom: 1rem; }
    h2 { color: #263954; font-size: 1rem; letter-spacing: -.02em; margin: 0; }
    .text-link { color: #6159e9; font-size: .76rem; font-weight: 750; text-decoration: none; }
    .schedule { display: grid; }
    .schedule-row { align-items: center; border-top: 1px solid #eff2f7; display: grid; gap: .8rem; grid-template-columns: 4.2rem 1fr auto; padding: .86rem 0; }
    .schedule-row:first-child { border-top: 0; padding-top: .15rem; }
    .time { color: #6a7a94; font-size: .76rem; font-weight: 750; }
    .class-title { color: #31445f; display: block; font-size: .84rem; font-weight: 750; }
    .class-detail { color: #8795ab; display: block; font-size: .73rem; margin-top: .16rem; }
    .pill { border-radius: 100px; font-size: .67rem; font-weight: 800; padding: .33rem .55rem; }
    .pill.indigo { background: #eeecff; color: #6159e9; } .pill.cyan { background: #e8f9fc; color: #178bab; } .pill.orange { background: #fff3e8; color: #c87534; }
    .attention { display: grid; gap: .75rem; }
    .attention-item { align-items: start; display: grid; gap: .65rem; grid-template-columns: 2rem 1fr; }
    .attention-mark { align-items: center; background: #f0efff; border-radius: .58rem; color: #6259e9; display: flex; font-size: .82rem; font-weight: 800; height: 2rem; justify-content: center; }
    .attention-item:nth-child(2) .attention-mark { background: #fff2e6; color: #d77e37; } .attention-item:nth-child(3) .attention-mark { background: #e8f8f3; color: #1c9a75; }
    .attention-item strong { color: #344762; display: block; font-size: .79rem; margin-top: .08rem; }
    .attention-item small { color: #8996aa; display: block; font-size: .71rem; line-height: 1.4; margin-top: .18rem; }
    .lower { display: grid; gap: 1rem; grid-template-columns: 1.15fr .85fr; margin-top: 1rem; }
    .quick-grid { display: grid; gap: .65rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .quick-link { background: #f6f7fc; border: 1px solid transparent; border-radius: .75rem; color: #344762; display: flex; flex-direction: column; gap: .22rem; min-height: 4.4rem; padding: .75rem; text-decoration: none; transition: border-color .18s ease, transform .18s ease; }
    .quick-link:hover { border-color: #d9d5ff; transform: translateY(-2px); } .quick-link strong { font-size: .78rem; } .quick-link span { color: #8795ab; font-size: .69rem; }
    .moment { background: linear-gradient(135deg, #172e53, #324e7c); border: 0; color: #fff; overflow: hidden; position: relative; }
    .moment::before { background: rgba(133, 203, 247, .15); border-radius: 50%; content: ''; height: 11rem; position: absolute; right: -4.8rem; top: -5.7rem; width: 11rem; }
    .moment h2, .moment p { color: #fff; position: relative; } .moment p { color: #b9cae5; font-size: .78rem; line-height: 1.55; margin: .5rem 0 1rem; max-width: 18rem; }
    .moment-tag { background: rgba(255,255,255,.13); border-radius: 100px; color: #e6efff; display: inline-block; font-size: .68rem; font-weight: 700; padding: .35rem .55rem; position: relative; }
    @media (max-width: 1100px) { .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } } @media (max-width: 760px) { .hero, .grid, .lower { display: grid; grid-template-columns: 1fr; } .primary-action { justify-content: center; } } @media (max-width: 440px) { .metrics, .quick-grid { grid-template-columns: 1fr; } .schedule-row { grid-template-columns: 3.6rem 1fr; } .pill { display: none; } }
  `,
  template: `
    <section class="hero">
      <div>
        <p class="eyebrow">{{ i18n.t('dashboard.commandCentre', { role: roleLabel() }) }}</p>
        <h1>{{ i18n.t('dashboard.greeting', { name: firstName() }) }}</h1>
        <p>{{ i18n.t('dashboard.description') }}</p>
      </div>
      <a class="primary-action" [routerLink]="primaryLink().path"><span>＋</span>{{ i18n.t(primaryLink().labelKey) }}</a>
    </section>
    @if (accessRestricted) { <p class="restriction">{{ i18n.t('dashboard.restriction') }}</p> }

    <section class="metrics" [attr.aria-label]="i18n.t('dashboard.overviewAria')">
      @for (metric of metrics(); track metric.labelKey) {
        <article class="metric" [class]="metric.tone">
          <span class="metric-label">{{ i18n.t(metric.labelKey) }}</span>
          <strong>{{ metric.value }}</strong>
          <small>{{ i18n.t(metric.detailKey) }}</small>
        </article>
      }
    </section>

    <section class="grid">
      <article class="panel">
        <div class="panel-head"><h2>{{ i18n.t('dashboard.classFlow') }}</h2><a class="text-link" routerLink="/attendance">{{ i18n.t('dashboard.openAttendance') }}</a></div>
        <div class="schedule">
          @for (item of schedule; track item.time + item.titleKey) {
            <div class="schedule-row">
              <span class="time">{{ item.time }}</span>
              <span><span class="class-title">{{ i18n.t(item.titleKey) }}</span><span class="class-detail">{{ i18n.t(item.detailKey) }}</span></span>
              <span class="pill" [class]="item.tone">{{ i18n.t(item.stateKey) }}</span>
            </div>
          }
        </div>
      </article>
      <article class="panel">
        <div class="panel-head"><h2>{{ i18n.t('dashboard.needsAttention') }}</h2><span class="text-link">{{ i18n.t('common.today') }}</span></div>
        <div class="attention">
          <div class="attention-item"><span class="attention-mark">14</span><span><strong>{{ i18n.t('dashboard.attendanceExceptions') }}</strong><small>{{ i18n.t('dashboard.attendanceExceptionsDetail') }}</small></span></div>
          <div class="attention-item"><span class="attention-mark">6</span><span><strong>{{ i18n.t('dashboard.upcomingDeadlines') }}</strong><small>{{ i18n.t('dashboard.upcomingDeadlinesDetail') }}</small></span></div>
          <div class="attention-item"><span class="attention-mark">3</span><span><strong>{{ i18n.t('dashboard.teamUpdates') }}</strong><small>{{ i18n.t('dashboard.teamUpdatesDetail') }}</small></span></div>
        </div>
      </article>
    </section>

    <section class="lower">
      <article class="panel">
        <div class="panel-head"><h2>{{ i18n.t('dashboard.quickWorkspace') }}</h2><span class="text-link">{{ i18n.t('dashboard.roleAware') }}</span></div>
        <div class="quick-grid">
          @for (item of quickLinks(); track item.path) {
            <a class="quick-link" [routerLink]="item.path"><strong>{{ i18n.t(item.labelKey) }}</strong><span>{{ item.captionKey ? i18n.t(item.captionKey) : i18n.t('common.openWorkspace') }}</span></a>
          }
        </div>
      </article>
      <article class="panel moment">
        <h2>{{ i18n.t('dashboard.keepMoving') }}</h2>
        <p>{{ i18n.t('dashboard.keepMovingDetail') }}</p>
        <span class="moment-tag">{{ i18n.t('dashboard.secureWorkspace') }}</span>
      </article>
    </section>
  `,
})
export class DashboardComponent {
  private readonly auth = inject(AuthFacade);
  private readonly route = inject(ActivatedRoute);
  readonly i18n = inject(I18nService);
  readonly accessRestricted = this.route.snapshot.queryParamMap.get('notice') === 'access-restricted';
  readonly role = computed(() => this.auth.session()?.user.role || 'Member');
  readonly roleLabel = computed(() => this.i18n.t(`roles.${this.role()}`));
  readonly firstName = computed(() => this.auth.session()?.user.fullName.split(' ')[0] || this.i18n.t('dashboard.greetingFallback'));
  readonly quickLinks = computed(() => APP_NAVIGATION
    .filter((item) => item.path !== '/dashboard' && hasRole(this.role(), item.roles))
    .slice(0, 4));
  readonly primaryLink = computed(() => this.quickLinks()[0] || { path: '/dashboard', labelKey: 'dashboard.viewDashboard' });
  readonly metrics = computed<ModuleCard[]>(() => dashboardMetrics(this.role()));
  readonly schedule: ScheduleItem[] = [
    { time: '09:00', titleKey: 'dashboard.math', detailKey: 'dashboard.room203', stateKey: 'dashboard.now', tone: 'indigo' },
    { time: '10:00', titleKey: 'dashboard.science', detailKey: 'dashboard.lab2', stateKey: 'dashboard.next', tone: 'cyan' },
    { time: '11:15', titleKey: 'dashboard.english', detailKey: 'dashboard.room105', stateKey: 'dashboard.later', tone: 'orange' },
    { time: '12:15', titleKey: 'dashboard.bangla', detailKey: 'dashboard.room112', stateKey: 'dashboard.later', tone: 'indigo' },
  ];
}

function dashboardMetrics(role: string): ModuleCard[] {
  if (role === 'Accountant') {
    return [
      dashboardMetric('metric.collectedToday', '৳ 42,600', 'metric.collectedTodayDetail', 'indigo'),
      dashboardMetric('metric.outstandingFees', '৳ 1.8L', 'metric.outstandingFeesDetail', 'orange'),
      dashboardMetric('metric.dueThisWeek', '৳ 3.2L', 'metric.dueThisWeekDetail', 'cyan'),
      dashboardMetric('metric.reconciled', '96%', 'metric.reconciledDetail', 'violet'),
    ];
  }

  if (role === 'Teacher') {
    return [
      dashboardMetric('metric.classesToday', '4', 'metric.classesTodayDetail', 'indigo'),
      dashboardMetric('metric.learnersToday', '138', 'metric.learnersTodayDetail', 'cyan'),
      dashboardMetric('metric.attendance', '93.4%', 'metric.attendanceDetail', 'violet'),
      dashboardMetric('metric.marksToReview', '24', 'metric.marksToReviewDetail', 'orange'),
    ];
  }

  if (role === 'Student' || role === 'Guardian') {
    return [
      dashboardMetric('metric.todaysClasses', '3', 'metric.todaysClassesDetail', 'indigo'),
      dashboardMetric('metric.attendance', '96%', 'metric.studentAttendanceDetail', 'cyan'),
      dashboardMetric('metric.upcomingAssessments', '2', 'metric.upcomingAssessmentsDetail', 'violet'),
      dashboardMetric('metric.messages', '1', 'metric.messagesDetail', 'orange'),
    ];
  }

  return [
    dashboardMetric('metric.activeLearners', '1,248', 'metric.activeLearnersDetail', 'indigo'),
    dashboardMetric('metric.attendanceToday', '93.4%', 'metric.attendanceTodayDetail', 'cyan'),
    dashboardMetric('metric.collections', '৳ 8.4L', 'metric.collectionsDetail', 'violet'),
    dashboardMetric('metric.openActions', '23', 'metric.openActionsDetail', 'orange'),
  ];
}

function dashboardMetric(
  labelKey: string,
  value: string,
  detailKey: string,
  tone: ModuleCard['tone'],
): ModuleCard {
  return { labelKey, value, detailKey, tone };
}
