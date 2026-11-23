import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { APP_NAVIGATION, hasRole, ModuleCard } from '../../../core/navigation/navigation';

interface ScheduleItem {
  time: string;
  title: string;
  detail: string;
  state: 'Now' | 'Next' | 'Later';
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
        <p class="eyebrow">{{ role() }} command centre</p>
        <h1>Good morning, {{ firstName() }}.</h1>
        <p>Here is the clearest view of your coaching day: people, classes and the work that needs your attention.</p>
      </div>
      <a class="primary-action" [routerLink]="primaryLink().path"><span>＋</span>{{ primaryLink().label }}</a>
    </section>
    @if (accessRestricted) { <p class="restriction">This module is not available for your current role. Your workspace has been kept on the areas you can access.</p> }

    <section class="metrics" aria-label="Today's overview">
      @for (metric of metrics(); track metric.label) {
        <article class="metric" [class]="metric.tone">
          <span class="metric-label">{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
          <small><b>{{ metric.detail.split('·')[0] }}</b>{{ metric.detail.includes('·') ? ' · ' + metric.detail.split('·')[1] : '' }}</small>
        </article>
      }
    </section>

    <section class="grid">
      <article class="panel">
        <div class="panel-head"><h2>Today’s class flow</h2><a class="text-link" routerLink="/attendance">Open attendance</a></div>
        <div class="schedule">
          @for (item of schedule; track item.time + item.title) {
            <div class="schedule-row">
              <span class="time">{{ item.time }}</span>
              <span><span class="class-title">{{ item.title }}</span><span class="class-detail">{{ item.detail }}</span></span>
              <span class="pill" [class]="item.tone">{{ item.state }}</span>
            </div>
          }
        </div>
      </article>
      <article class="panel">
        <div class="panel-head"><h2>Needs attention</h2><span class="text-link">Today</span></div>
        <div class="attention">
          <div class="attention-item"><span class="attention-mark">14</span><span><strong>Attendance exceptions</strong><small>Late or missing check-ins waiting for a quick review.</small></span></div>
          <div class="attention-item"><span class="attention-mark">6</span><span><strong>Upcoming deadlines</strong><small>Assessment plans and fee due dates are approaching.</small></span></div>
          <div class="attention-item"><span class="attention-mark">3</span><span><strong>Team updates</strong><small>New activity from staff and campus devices.</small></span></div>
        </div>
      </article>
    </section>

    <section class="lower">
      <article class="panel">
        <div class="panel-head"><h2>Quick workspace</h2><span class="text-link">Role-aware</span></div>
        <div class="quick-grid">
          @for (item of quickLinks(); track item.path) {
            <a class="quick-link" [routerLink]="item.path"><strong>{{ item.label }}</strong><span>{{ item.caption || 'Open workspace' }}</span></a>
          }
        </div>
      </article>
      <article class="panel moment">
        <h2>Keep the day moving</h2>
        <p>Your dashboard adapts to your role. Navigation and routes stay aligned with the API policies that protect each service.</p>
        <span class="moment-tag">Secure role workspace</span>
      </article>
    </section>
  `,
})
export class DashboardComponent {
  private readonly auth = inject(AuthFacade);
  private readonly route = inject(ActivatedRoute);
  readonly accessRestricted = this.route.snapshot.queryParamMap.get('notice') === 'access-restricted';
  readonly role = computed(() => this.auth.session()?.user.role || 'Member');
  readonly firstName = computed(() => this.auth.session()?.user.fullName.split(' ')[0] || 'there');
  readonly quickLinks = computed(() => APP_NAVIGATION
    .filter((item) => item.path !== '/dashboard' && hasRole(this.role(), item.roles))
    .slice(0, 4));
  readonly primaryLink = computed(() => this.quickLinks()[0] || { path: '/dashboard', label: 'View dashboard' });
  readonly metrics = computed<ModuleCard[]>(() => dashboardMetrics(this.role()));
  readonly schedule: ScheduleItem[] = [
    { time: '09:00', title: 'General Mathematics', detail: 'Class 8 · Room 203', state: 'Now', tone: 'indigo' },
    { time: '10:00', title: 'General Science', detail: 'Class 7 · Lab 2', state: 'Next', tone: 'cyan' },
    { time: '11:15', title: 'English Language', detail: 'Class 8 · Room 105', state: 'Later', tone: 'orange' },
    { time: '12:15', title: 'Bangla Literature', detail: 'Class 6 · Room 112', state: 'Later', tone: 'indigo' },
  ];
}

function dashboardMetrics(role: string): ModuleCard[] {
  if (role === 'Accountant') {
    return [
      { label: 'Collected today', value: '৳ 42,600', detail: '+12% · 18 payments', tone: 'indigo' },
      { label: 'Outstanding fees', value: '৳ 1.8L', detail: '114 · learner accounts', tone: 'orange' },
      { label: 'Due this week', value: '৳ 3.2L', detail: '74 · invoices', tone: 'cyan' },
      { label: 'Reconciled', value: '96%', detail: '+4% · this month', tone: 'violet' },
    ];
  }

  if (role === 'Teacher') {
    return [
      { label: 'Classes today', value: '4', detail: '1 · in progress', tone: 'indigo' },
      { label: 'Learners today', value: '138', detail: '+6 · vs yesterday', tone: 'cyan' },
      { label: 'Attendance', value: '93.4%', detail: '+1.8% · on track', tone: 'violet' },
      { label: 'Marks to review', value: '24', detail: '3 · assessments', tone: 'orange' },
    ];
  }

  if (role === 'Student' || role === 'Guardian') {
    return [
      { label: 'Today’s classes', value: '3', detail: '1 · starting soon', tone: 'indigo' },
      { label: 'Attendance', value: '96%', detail: '+2% · this month', tone: 'cyan' },
      { label: 'Upcoming assessments', value: '2', detail: 'Next · 28 Nov', tone: 'violet' },
      { label: 'Messages', value: '1', detail: 'New · from coaching', tone: 'orange' },
    ];
  }

  return [
    { label: 'Active learners', value: '1,248', detail: '+36 · this month', tone: 'indigo' },
    { label: 'Attendance today', value: '93.4%', detail: '+1.8% · on track', tone: 'cyan' },
    { label: 'Collections', value: '৳ 8.4L', detail: '82% · monthly target', tone: 'violet' },
    { label: 'Open actions', value: '23', detail: '14 · attendance reviews', tone: 'orange' },
  ];
}
