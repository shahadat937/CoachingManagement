import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ModuleRouteData, ModuleRow } from '../../../core/navigation/navigation';
import { CoachingModuleApi } from '../data/coaching-module.api';

@Component({
  selector: 'app-module-page',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .page-head { align-items: end; display: flex; gap: 1.5rem; justify-content: space-between; margin: .3rem 0 1.6rem; }
    .eyebrow { color: #7169eb; font-size: .72rem; font-weight: 800; letter-spacing: .09em; margin: 0 0 .48rem; text-transform: uppercase; }
    h1 { color: #162945; font-size: clamp(1.55rem, 3vw, 2.1rem); letter-spacing: -.045em; line-height: 1.08; margin: 0; }
    .description { color: #708099; font-size: .92rem; line-height: 1.55; margin: .55rem 0 0; max-width: 43rem; }
    .primary { background: #6159e9; border: 0; border-radius: .72rem; box-shadow: 0 10px 22px rgba(91, 80, 224, .22); color: #fff; cursor: pointer; font: inherit; font-size: .82rem; font-weight: 750; padding: .78rem 1rem; white-space: nowrap; }
    .metrics { display: grid; gap: 1rem; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-bottom: 1rem; }
    .metric { background: #fff; border: 1px solid #e8edf6; border-radius: .95rem; padding: 1rem 1.1rem; }
    .metric.indigo { border-top: 3px solid #6259e9; } .metric.cyan { border-top: 3px solid #27b9d9; } .metric.violet { border-top: 3px solid #9d73eb; } .metric.orange { border-top: 3px solid #f29d5d; }
    .metric span { color: #72819a; font-size: .75rem; font-weight: 700; } .metric strong { color: #263954; display: block; font-size: 1.35rem; letter-spacing: -.035em; margin: .48rem 0 .18rem; } .metric small { color: #8a97ab; font-size: .7rem; }
    .workspace { background: #fff; border: 1px solid #e8edf6; border-radius: 1rem; overflow: hidden; }
    .workspace-top { align-items: center; display: flex; gap: 1rem; justify-content: space-between; padding: 1.05rem 1.2rem; }
    .workspace-top h2 { color: #2b3e59; font-size: 1rem; letter-spacing: -.02em; margin: 0; } .workspace-top p { color: #8795a9; font-size: .72rem; margin: .25rem 0 0; }
    .search { align-items: center; background: #f5f7fb; border: 1px solid #e9edf5; border-radius: .65rem; color: #8795aa; display: flex; gap: .45rem; padding: .5rem .65rem; width: min(100%, 16rem); }
    .search svg { fill: none; height: .95rem; stroke: currentColor; stroke-width: 2; width: .95rem; } .search input { background: transparent; border: 0; color: #344762; font: inherit; font-size: .76rem; min-width: 0; outline: 0; width: 100%; }
    .table-wrap { overflow-x: auto; } table { border-collapse: collapse; min-width: 40rem; width: 100%; } th { background: #fafbfe; border-bottom: 1px solid #e9edf5; color: #77869d; font-size: .68rem; font-weight: 800; letter-spacing: .05em; padding: .72rem 1.1rem; text-align: left; text-transform: uppercase; } td { border-bottom: 1px solid #eef1f6; color: #445570; font-size: .78rem; padding: .92rem 1.1rem; white-space: nowrap; } tr:last-child td { border-bottom: 0; } td:first-child { color: #2f415d; font-weight: 750; }
    .status { background: #edf8f4; border-radius: 100px; color: #178664; display: inline-flex; font-size: .67rem; font-weight: 800; padding: .28rem .48rem; } .status:has(+ *) { } .table-wrap tr:has(td:last-child) td:last-child { color: #58708d; }
    .footer { align-items: center; border-top: 1px solid #eef1f6; color: #8391a5; display: flex; font-size: .72rem; justify-content: space-between; padding: .8rem 1.2rem; }
    .endpoint { color: #665eea; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .68rem; }
    .toast { align-items: center; background: #152b4c; border-radius: .65rem; bottom: 1.2rem; box-shadow: 0 13px 26px rgba(12, 28, 53, .25); color: #fff; display: flex; font-size: .78rem; gap: .45rem; padding: .75rem .9rem; position: fixed; right: 1.2rem; z-index: 50; } .toast span { color: #7edcbf; font-weight: 800; }
    .empty { color: #8492a7; font-size: .82rem; padding: 2rem; text-align: center; }
    @media (max-width: 700px) { .page-head { align-items: stretch; display: grid; grid-template-columns: 1fr; } .primary { width: 100%; } .metrics { grid-template-columns: 1fr; } .workspace-top { align-items: stretch; flex-direction: column; } .search { width: 100%; } }
  `,
  template: `
    <section class="page-head">
      <div>
        <p class="eyebrow">{{ data.eyebrow }}</p>
        <h1>{{ data.title }}</h1>
        <p class="description">{{ data.description }}</p>
      </div>
      <button class="primary" type="button" (click)="openAction()">＋ {{ data.action }}</button>
    </section>

    <section class="metrics">
      @for (metric of data.metrics; track metric.label) {
        <article class="metric" [class]="metric.tone">
          <span>{{ metric.label }}</span><strong>{{ metric.value }}</strong><small>{{ metric.detail }}</small>
        </article>
      }
    </section>

    <section class="workspace">
      <div class="workspace-top">
        <div><h2>Latest workspace records</h2><p>{{ liveData() ? 'Live records loaded from the protected service.' : 'Preview data shown until the module service is online.' }}</p></div>
        <label class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg><input [ngModel]="query()" (ngModelChange)="query.set($event)" type="search" placeholder="Filter records" /></label>
      </div>
      <div class="table-wrap">
        @if (filteredRows().length) {
          <table>
            <thead><tr>@for (column of data.columns; track column.key) { <th>{{ column.label }}</th> }</tr></thead>
            <tbody>
              @for (row of filteredRows(); track row.id) {
                <tr>@for (column of data.columns; track column.key) { <td>{{ row[column.key] }}</td> }</tr>
              }
            </tbody>
          </table>
        } @else { <p class="empty">No matching records. Try a different search.</p> }
      </div>
      <footer class="footer"><span>Showing {{ filteredRows().length }} of {{ rows().length }} records</span><span class="endpoint">{{ data.endpoint }}</span></footer>
    </section>

    @if (toast()) { <div class="toast"><span>Ready</span>{{ toast() }}</div> }
  `,
})
export class ModulePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CoachingModuleApi);
  readonly data = this.route.snapshot.data as ModuleRouteData;
  readonly query = signal('');
  readonly toast = signal<string | null>(null);
  readonly rows = signal<ModuleRow[]>(this.data.rows);
  readonly liveData = signal(false);
  readonly filteredRows = computed(() => filterRows(this.rows(), this.query()));
  private toastTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    if (!this.data.apiPath) { return; }

    this.api.list(this.data.apiPath).subscribe({
      next: (records) => {
        const rows = toModuleRows(this.data.module, records);
        if (rows.length) {
          this.rows.set(rows);
          this.liveData.set(true);
        }
      },
      // The interface remains useful while a local microservice is stopped.
      error: () => this.liveData.set(false),
    });
  }

  openAction(): void {
    this.toast.set(`${this.data.action} is ready to connect to the protected API flow.`);
    if (this.toastTimer) { clearTimeout(this.toastTimer); }
    this.toastTimer = setTimeout(() => this.toast.set(null), 3600);
  }
}

function filterRows(rows: ModuleRow[], query: string): ModuleRow[] {
  const term = query.trim().toLowerCase();
  if (!term) { return rows; }
  return rows.filter((row) => Object.values(row).some((value) => value.toLowerCase().includes(term)));
}

function toModuleRows(module: string, records: Record<string, unknown>[]): ModuleRow[] {
  return records.map((record, index): ModuleRow => {
    const id = text(record['id']) || `${module}-${index}`;
    switch (module) {
      case 'students': return {
        id, name: text(record['fullName']), studentNo: text(record['studentNo']),
        classLevel: classLabel(record['classLevel']), guardian: text(record['guardianPhone']) || '—', status: 'Active',
      };
      case 'academic': return {
        id, name: text(record['name']), code: text(record['code']), classLevel: classLabel(record['classLevel']),
        teacher: 'Assigned by coaching', status: 'Published',
      };
      case 'exams': return {
        id, name: text(record['title']), classLevel: classLabel(record['classLevel']), subject: text(record['subjectId']) || '—',
        date: friendlyDate(record['examDate']), status: 'Scheduled',
      };
      case 'finance': return {
        id, name: text(record['title']), student: text(record['studentId']), amount: money(record['amount']),
        dueDate: friendlyDate(record['dueDate']), status: text(record['paidAmount']) === text(record['amount']) ? 'Paid' : 'Outstanding',
      };
      case 'devices': return {
        id, name: text(record['name']), serial: text(record['serial']), room: text(record['roomCode']) || '—',
        lastSeen: friendlyDate(record['lastSeenAt']), status: record['isActive'] === false ? 'Offline' : 'Online',
      };
      case 'users': return {
        id, name: text(record['fullName']), email: text(record['email']), role: text(record['role']),
        lastSeen: 'Active session', status: 'Active',
      };
      default: return { id, name: text(record['name']) || text(record['title']) || 'Record', status: 'Active' };
    }
  });
}

function text(value: unknown): string {
  return value === null || value === undefined || value === '' ? '—' : String(value);
}

function classLabel(value: unknown): string {
  return value === null || value === undefined ? '—' : `Class ${value}`;
}

function money(value: unknown): string {
  const amount = Number(value);
  return Number.isFinite(amount) ? `৳ ${amount.toLocaleString('en-BD')}` : '—';
}

function friendlyDate(value: unknown): string {
  if (!value) { return '—'; }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? text(value) : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
