export type CoachingRole = 'Admin' | 'Teacher' | 'Accountant' | 'Student' | 'Guardian';

export type NavigationIcon =
  | 'dashboard'
  | 'students'
  | 'academic'
  | 'attendance'
  | 'exams'
  | 'finance'
  | 'devices'
  | 'users';

export interface NavigationItem {
  labelKey: string;
  path: string;
  icon: NavigationIcon;
  roles: CoachingRole[];
  captionKey?: string;
}

export interface ModuleCard {
  labelKey: string;
  value: string;
  detailKey: string;
  tone: 'indigo' | 'cyan' | 'violet' | 'orange';
}

export interface ModuleColumn {
  key: string;
  labelKey: string;
}

export interface ModuleRow {
  id: string;
  [key: string]: string;
}

export interface ModuleRouteData {
  module: string;
  titleKey: string;
  eyebrowKey: string;
  descriptionKey: string;
  endpoint: string;
  apiPath?: string;
  actionKey: string;
  roles: CoachingRole[];
  metrics: ModuleCard[];
  columns: ModuleColumn[];
  rows: ModuleRow[];
}

export const APP_NAVIGATION: NavigationItem[] = [
  { labelKey: 'nav.overview', path: '/dashboard', icon: 'dashboard', roles: ['Admin', 'Teacher', 'Accountant', 'Student', 'Guardian'] },
  { labelKey: 'nav.students', path: '/students', icon: 'students', roles: ['Admin', 'Teacher'], captionKey: 'nav.studentsCaption' },
  { labelKey: 'nav.academic', path: '/academic', icon: 'academic', roles: ['Admin', 'Teacher'], captionKey: 'nav.academicCaption' },
  { labelKey: 'nav.attendance', path: '/attendance', icon: 'attendance', roles: ['Admin', 'Teacher'], captionKey: 'nav.attendanceCaption' },
  { labelKey: 'nav.exams', path: '/exams', icon: 'exams', roles: ['Admin', 'Teacher'], captionKey: 'nav.examsCaption' },
  { labelKey: 'nav.finance', path: '/finance', icon: 'finance', roles: ['Admin', 'Accountant'], captionKey: 'nav.financeCaption' },
  { labelKey: 'nav.devices', path: '/devices', icon: 'devices', roles: ['Admin'], captionKey: 'nav.devicesCaption' },
  { labelKey: 'nav.users', path: '/users', icon: 'users', roles: ['Admin'], captionKey: 'nav.usersCaption' },
];

const metric = (
  module: string,
  key: string,
  value: string,
  tone: ModuleCard['tone'],
): ModuleCard => ({
  labelKey: `module.${module}.${key}`,
  value,
  detailKey: `module.${module}.${key}Detail`,
  tone,
});

const column = (key: string, labelKey: string): ModuleColumn => ({ key, labelKey });

const moduleData = (
  module: string,
  endpoint: string,
  apiPath: string | undefined,
  roles: CoachingRole[],
  metrics: ModuleCard[],
  columns: ModuleColumn[],
  rows: ModuleRow[],
): ModuleRouteData => ({
  module,
  titleKey: `module.${module}.title`,
  eyebrowKey: `module.${module}.eyebrow`,
  descriptionKey: `module.${module}.description`,
  endpoint,
  ...(apiPath ? { apiPath } : {}),
  actionKey: `module.${module}.action`,
  roles,
  metrics,
  columns,
  rows,
});

export const MODULE_DATA: Record<string, ModuleRouteData> = {
  students: moduleData(
    'students',
    'GET /api/students',
    '/api/students',
    ['Admin', 'Teacher'],
    [
      metric('students', 'activeLearners', '1,248', 'indigo'),
      metric('students', 'newThisMonth', '36', 'cyan'),
      metric('students', 'guardianProfiles', '1,109', 'violet'),
    ],
    [
      column('name', 'column.student'),
      column('studentNo', 'column.studentNo'),
      column('classLevel', 'column.class'),
      column('guardian', 'column.guardian'),
      column('status', 'column.status'),
    ],
    [
      { id: 's1', name: 'Nusrat Jahan', studentNo: 'ST-1024', classLevel: 'Class 8', guardian: '+880 1712 000 421', status: 'Active' },
      { id: 's2', name: 'Arafat Hossain', studentNo: 'ST-1007', classLevel: 'Class 8', guardian: '+880 1914 000 155', status: 'Active' },
      { id: 's3', name: 'Mim Akter', studentNo: 'ST-0988', classLevel: 'Class 7', guardian: '+880 1813 000 675', status: 'Pending' },
      { id: 's4', name: 'Tanjim Hasan', studentNo: 'ST-0975', classLevel: 'Class 7', guardian: '+880 1619 000 334', status: 'Active' },
    ],
  ),
  academic: moduleData(
    'academic',
    'GET /api/subjects',
    '/api/subjects',
    ['Admin', 'Teacher'],
    [
      metric('academic', 'subjects', '42', 'indigo'),
      metric('academic', 'teachingGroups', '68', 'cyan'),
      metric('academic', 'publishedPlans', '91%', 'violet'),
    ],
    [
      column('name', 'column.subject'),
      column('code', 'column.code'),
      column('classLevel', 'column.classLevel'),
      column('teacher', 'column.teacher'),
      column('status', 'column.planStatus'),
    ],
    [
      { id: 'a1', name: 'General Mathematics', code: 'MATH-08', classLevel: 'Class 8', teacher: 'Maya Rahman', status: 'Published' },
      { id: 'a2', name: 'English Language', code: 'ENG-08', classLevel: 'Class 8', teacher: 'Farhana Islam', status: 'Published' },
      { id: 'a3', name: 'General Science', code: 'SCI-07', classLevel: 'Class 7', teacher: 'Saif Ahmed', status: 'Review needed' },
      { id: 'a4', name: 'Bangla Literature', code: 'BAN-07', classLevel: 'Class 6', teacher: 'Tasnim Sultana', status: 'Published' },
    ],
  ),
  attendance: moduleData(
    'attendance',
    'GET /api/attendance/sessions/{sessionId}/records',
    undefined,
    ['Admin', 'Teacher'],
    [
      metric('attendance', 'presentToday', '93.4%', 'indigo'),
      metric('attendance', 'openSessions', '6', 'cyan'),
      metric('attendance', 'needsReview', '14', 'orange'),
    ],
    [
      column('name', 'column.session'),
      column('classLevel', 'column.class'),
      column('room', 'column.room'),
      column('time', 'column.time'),
      column('status', 'column.status'),
    ],
    [
      { id: 'at1', name: 'General Mathematics', classLevel: 'Class 8', room: 'Room 203', time: '09:00 – 09:50', status: 'In progress' },
      { id: 'at2', name: 'English Language', classLevel: 'Class 7', room: 'Room 105', time: '09:00 – 09:50', status: 'In progress' },
      { id: 'at3', name: 'General Science', classLevel: 'Class 8', room: 'Lab 2', time: '10:00 – 10:50', status: 'Upcoming' },
      { id: 'at4', name: 'Bangla Literature', classLevel: 'Class 6', room: 'Room 112', time: '10:00 – 10:50', status: 'Upcoming' },
    ],
  ),
  exams: moduleData(
    'exams',
    'GET /api/exams',
    '/api/exams',
    ['Admin', 'Teacher'],
    [
      metric('exams', 'scheduled', '12', 'indigo'),
      metric('exams', 'marksSubmitted', '78%', 'cyan'),
      metric('exams', 'resultDrafts', '6', 'violet'),
    ],
    [
      column('name', 'column.assessment'),
      column('classLevel', 'column.class'),
      column('subject', 'column.subject'),
      column('date', 'column.date'),
      column('status', 'column.status'),
    ],
    [
      { id: 'e1', name: 'Monthly assessment', classLevel: 'Class 8', subject: 'General Mathematics', date: '28 Nov 2026', status: 'Scheduled' },
      { id: 'e2', name: 'Unit test 3', classLevel: 'Class 7', subject: 'General Science', date: '30 Nov 2026', status: 'Draft' },
      { id: 'e3', name: 'Term final', classLevel: 'Class 10', subject: 'English Language', date: '04 Dec 2026', status: 'Marks pending' },
      { id: 'e4', name: 'Practice exam', classLevel: 'Class 8', subject: 'Bangla Literature', date: '06 Dec 2026', status: 'Scheduled' },
    ],
  ),
  finance: moduleData(
    'finance',
    'GET /api/fee-invoices',
    '/api/fee-invoices',
    ['Admin', 'Accountant'],
    [
      metric('finance', 'collected', '৳ 8.4L', 'indigo'),
      metric('finance', 'outstanding', '৳ 1.8L', 'orange'),
      metric('finance', 'paidToday', '৳ 42,600', 'cyan'),
    ],
    [
      column('name', 'column.invoice'),
      column('student', 'column.student'),
      column('amount', 'column.amount'),
      column('dueDate', 'column.dueDate'),
      column('status', 'column.status'),
    ],
    [
      { id: 'f1', name: 'November tuition', student: 'Nusrat Jahan', amount: '৳ 4,500', dueDate: '25 Nov 2026', status: 'Paid' },
      { id: 'f2', name: 'November tuition', student: 'Arafat Hossain', amount: '৳ 4,500', dueDate: '25 Nov 2026', status: 'Due soon' },
      { id: 'f3', name: 'Lab materials', student: 'Mim Akter', amount: '৳ 1,200', dueDate: '28 Nov 2026', status: 'Outstanding' },
      { id: 'f4', name: 'November tuition', student: 'Tanjim Hasan', amount: '৳ 4,500', dueDate: '25 Nov 2026', status: 'Partial' },
    ],
  ),
  devices: moduleData(
    'devices',
    'GET /api/devices',
    '/api/devices',
    ['Admin'],
    [
      metric('devices', 'online', '14 / 16', 'cyan'),
      metric('devices', 'punches', '2,936', 'indigo'),
      metric('devices', 'alerts', '2', 'orange'),
    ],
    [
      column('name', 'column.device'),
      column('serial', 'column.serial'),
      column('room', 'column.room'),
      column('lastSeen', 'column.lastSeen'),
      column('status', 'column.status'),
    ],
    [
      { id: 'd1', name: 'North gate scanner', serial: 'ZK-NG-204', room: 'North gate', lastSeen: 'Just now', status: 'Online' },
      { id: 'd2', name: 'Level 2 scanner', serial: 'ZK-L2-112', room: 'Level 2', lastSeen: '2 min ago', status: 'Online' },
      { id: 'd3', name: 'Science lab scanner', serial: 'RF-SL-019', room: 'Lab 2', lastSeen: '48 min ago', status: 'Check-in needed' },
      { id: 'd4', name: 'East gate scanner', serial: 'ZK-EG-087', room: 'East gate', lastSeen: 'Yesterday', status: 'Offline' },
    ],
  ),
  users: moduleData(
    'users',
    'GET /api/users',
    '/api/users',
    ['Admin'],
    [
      metric('users', 'activeStaff', '58', 'indigo'),
      metric('users', 'teachers', '41', 'cyan'),
      metric('users', 'pendingInvites', '3', 'violet'),
    ],
    [
      column('name', 'column.teamMember'),
      column('email', 'column.email'),
      column('role', 'column.role'),
      column('lastSeen', 'column.lastSeen'),
      column('status', 'column.status'),
    ],
    [
      { id: 'u1', name: 'Maya Rahman', email: 'maya@coaching.local', role: 'Teacher', lastSeen: 'Just now', status: 'Active' },
      { id: 'u2', name: 'Farhana Islam', email: 'farhana@coaching.local', role: 'Teacher', lastSeen: '15 min ago', status: 'Active' },
      { id: 'u3', name: 'Rafiq Ahmed', email: 'rafiq@coaching.local', role: 'Accountant', lastSeen: 'Yesterday', status: 'Active' },
      { id: 'u4', name: 'Samia Karim', email: 'samia@coaching.local', role: 'Teacher', lastSeen: 'Invite sent', status: 'Pending' },
    ],
  ),
};

export function hasRole(role: string | undefined, allowedRoles: CoachingRole[]): boolean {
  return !!role && allowedRoles.includes(role as CoachingRole);
}
