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
  label: string;
  path: string;
  icon: NavigationIcon;
  roles: CoachingRole[];
  caption?: string;
}

export interface ModuleCard {
  label: string;
  value: string;
  detail: string;
  tone: 'indigo' | 'cyan' | 'violet' | 'orange';
}

export interface ModuleColumn {
  key: string;
  label: string;
}

export interface ModuleRow {
  id: string;
  [key: string]: string;
}

export interface ModuleRouteData {
  module: string;
  title: string;
  eyebrow: string;
  description: string;
  endpoint: string;
  apiPath?: string;
  action: string;
  roles: CoachingRole[];
  metrics: ModuleCard[];
  columns: ModuleColumn[];
  rows: ModuleRow[];
}

export const APP_NAVIGATION: NavigationItem[] = [
  { label: 'Overview', path: '/dashboard', icon: 'dashboard', roles: ['Admin', 'Teacher', 'Accountant', 'Student', 'Guardian'] },
  { label: 'Students', path: '/students', icon: 'students', roles: ['Admin', 'Teacher'], caption: 'Records & guardians' },
  { label: 'Academic', path: '/academic', icon: 'academic', roles: ['Admin', 'Teacher'], caption: 'Subjects & classes' },
  { label: 'Attendance', path: '/attendance', icon: 'attendance', roles: ['Admin', 'Teacher'], caption: 'Sessions & registers' },
  { label: 'Examinations', path: '/exams', icon: 'exams', roles: ['Admin', 'Teacher'], caption: 'Assessments & results' },
  { label: 'Finance', path: '/finance', icon: 'finance', roles: ['Admin', 'Accountant'], caption: 'Invoices & collections' },
  { label: 'Devices', path: '/devices', icon: 'devices', roles: ['Admin'], caption: 'Campus hardware' },
  { label: 'Team access', path: '/users', icon: 'users', roles: ['Admin'], caption: 'People & roles' },
];

export const MODULE_DATA: Record<string, ModuleRouteData> = {
  students: {
    module: 'students',
    title: 'Student directory',
    eyebrow: 'Student management',
    description: 'Keep enrolment, guardian and classroom information organised in one place.',
    endpoint: 'GET /api/students',
    apiPath: '/api/students',
    action: 'Add student',
    roles: ['Admin', 'Teacher'],
    metrics: [
      { label: 'Active learners', value: '1,248', detail: 'Across 12 class levels', tone: 'indigo' },
      { label: 'New this month', value: '36', detail: '8 awaiting review', tone: 'cyan' },
      { label: 'Guardian profiles', value: '1,109', detail: '89% contact coverage', tone: 'violet' },
    ],
    columns: [
      { key: 'name', label: 'Student' },
      { key: 'studentNo', label: 'Student no.' },
      { key: 'classLevel', label: 'Class' },
      { key: 'guardian', label: 'Guardian contact' },
      { key: 'status', label: 'Status' },
    ],
    rows: [
      { id: 's1', name: 'Nusrat Jahan', studentNo: 'ST-1024', classLevel: 'Class 8', guardian: '+880 1712 000 421', status: 'Active' },
      { id: 's2', name: 'Arafat Hossain', studentNo: 'ST-1007', classLevel: 'Class 8', guardian: '+880 1914 000 155', status: 'Active' },
      { id: 's3', name: 'Mim Akter', studentNo: 'ST-0988', classLevel: 'Class 7', guardian: '+880 1813 000 675', status: 'Pending' },
      { id: 's4', name: 'Tanjim Hasan', studentNo: 'ST-0975', classLevel: 'Class 7', guardian: '+880 1619 000 334', status: 'Active' },
    ],
  },
  academic: {
    module: 'academic',
    title: 'Academic setup',
    eyebrow: 'Curriculum workspace',
    description: 'Shape class offerings, subjects and teaching plans for every level.',
    endpoint: 'GET /api/subjects',
    apiPath: '/api/subjects',
    action: 'Add subject',
    roles: ['Admin', 'Teacher'],
    metrics: [
      { label: 'Subjects', value: '42', detail: 'Across all levels', tone: 'indigo' },
      { label: 'Teaching groups', value: '68', detail: 'This academic year', tone: 'cyan' },
      { label: 'Published plans', value: '91%', detail: '6 need attention', tone: 'violet' },
    ],
    columns: [
      { key: 'name', label: 'Subject' },
      { key: 'code', label: 'Code' },
      { key: 'classLevel', label: 'Class level' },
      { key: 'teacher', label: 'Lead teacher' },
      { key: 'status', label: 'Plan status' },
    ],
    rows: [
      { id: 'a1', name: 'General Mathematics', code: 'MATH-08', classLevel: 'Class 8', teacher: 'Maya Rahman', status: 'Published' },
      { id: 'a2', name: 'English Language', code: 'ENG-08', classLevel: 'Class 8', teacher: 'Farhana Islam', status: 'Published' },
      { id: 'a3', name: 'General Science', code: 'SCI-07', classLevel: 'Class 7', teacher: 'Saif Ahmed', status: 'Review needed' },
      { id: 'a4', name: 'Bangla Literature', code: 'BAN-07', classLevel: 'Class 7', teacher: 'Tasnim Sultana', status: 'Published' },
    ],
  },
  attendance: {
    module: 'attendance',
    title: 'Attendance centre',
    eyebrow: 'Daily operations',
    description: 'Open sessions, monitor punctuality and resolve register exceptions quickly.',
    endpoint: 'GET /api/attendance/sessions/{sessionId}/records',
    action: 'Open session',
    roles: ['Admin', 'Teacher'],
    metrics: [
      { label: 'Present today', value: '93.4%', detail: 'Up 1.8% from yesterday', tone: 'indigo' },
      { label: 'Open sessions', value: '6', detail: '2 ending in the next hour', tone: 'cyan' },
      { label: 'Needs review', value: '14', detail: 'Late or missing punches', tone: 'orange' },
    ],
    columns: [
      { key: 'name', label: 'Session' },
      { key: 'classLevel', label: 'Class' },
      { key: 'room', label: 'Room' },
      { key: 'time', label: 'Time' },
      { key: 'status', label: 'Status' },
    ],
    rows: [
      { id: 'at1', name: 'General Mathematics', classLevel: 'Class 8', room: 'Room 203', time: '09:00 – 09:50', status: 'In progress' },
      { id: 'at2', name: 'English Language', classLevel: 'Class 7', room: 'Room 105', time: '09:00 – 09:50', status: 'In progress' },
      { id: 'at3', name: 'General Science', classLevel: 'Class 8', room: 'Lab 2', time: '10:00 – 10:50', status: 'Upcoming' },
      { id: 'at4', name: 'Bangla Literature', classLevel: 'Class 6', room: 'Room 112', time: '10:00 – 10:50', status: 'Upcoming' },
    ],
  },
  exams: {
    module: 'exams',
    title: 'Examination desk',
    eyebrow: 'Assessment planning',
    description: 'Coordinate assessments, marks and result readiness across every class.',
    endpoint: 'GET /api/exams',
    apiPath: '/api/exams',
    action: 'Create exam',
    roles: ['Admin', 'Teacher'],
    metrics: [
      { label: 'Scheduled exams', value: '12', detail: 'Over the next 30 days', tone: 'indigo' },
      { label: 'Marks submitted', value: '78%', detail: '4 classes remain', tone: 'cyan' },
      { label: 'Result drafts', value: '6', detail: 'Awaiting approval', tone: 'violet' },
    ],
    columns: [
      { key: 'name', label: 'Assessment' },
      { key: 'classLevel', label: 'Class' },
      { key: 'subject', label: 'Subject' },
      { key: 'date', label: 'Date' },
      { key: 'status', label: 'Status' },
    ],
    rows: [
      { id: 'e1', name: 'Monthly assessment', classLevel: 'Class 8', subject: 'General Mathematics', date: '28 Nov 2026', status: 'Scheduled' },
      { id: 'e2', name: 'Unit test 3', classLevel: 'Class 7', subject: 'General Science', date: '30 Nov 2026', status: 'Draft' },
      { id: 'e3', name: 'Term final', classLevel: 'Class 10', subject: 'English Language', date: '04 Dec 2026', status: 'Marks pending' },
      { id: 'e4', name: 'Practice exam', classLevel: 'Class 8', subject: 'Bangla Literature', date: '06 Dec 2026', status: 'Scheduled' },
    ],
  },
  finance: {
    module: 'finance',
    title: 'Finance centre',
    eyebrow: 'Fees & collections',
    description: 'Track invoices, payments and outstanding balances without leaving the coaching workspace.',
    endpoint: 'GET /api/fee-invoices',
    apiPath: '/api/fee-invoices',
    action: 'Create invoice',
    roles: ['Admin', 'Accountant'],
    metrics: [
      { label: 'Collected this month', value: '৳ 8.4L', detail: '82% of target', tone: 'indigo' },
      { label: 'Outstanding', value: '৳ 1.8L', detail: '114 learner accounts', tone: 'orange' },
      { label: 'Paid today', value: '৳ 42,600', detail: '18 payments posted', tone: 'cyan' },
    ],
    columns: [
      { key: 'name', label: 'Invoice' },
      { key: 'student', label: 'Student' },
      { key: 'amount', label: 'Amount' },
      { key: 'dueDate', label: 'Due date' },
      { key: 'status', label: 'Status' },
    ],
    rows: [
      { id: 'f1', name: 'November tuition', student: 'Nusrat Jahan', amount: '৳ 4,500', dueDate: '25 Nov 2026', status: 'Paid' },
      { id: 'f2', name: 'November tuition', student: 'Arafat Hossain', amount: '৳ 4,500', dueDate: '25 Nov 2026', status: 'Due soon' },
      { id: 'f3', name: 'Lab materials', student: 'Mim Akter', amount: '৳ 1,200', dueDate: '28 Nov 2026', status: 'Outstanding' },
      { id: 'f4', name: 'November tuition', student: 'Tanjim Hasan', amount: '৳ 4,500', dueDate: '25 Nov 2026', status: 'Partial' },
    ],
  },
  devices: {
    module: 'devices',
    title: 'Device control',
    eyebrow: 'Campus hardware',
    description: 'Keep attendance devices connected, assigned and ready for each class change.',
    endpoint: 'GET /api/devices',
    apiPath: '/api/devices',
    action: 'Register device',
    roles: ['Admin'],
    metrics: [
      { label: 'Online devices', value: '14 / 16', detail: '2 need a check-in', tone: 'cyan' },
      { label: 'Punches today', value: '2,936', detail: '98.7% matched', tone: 'indigo' },
      { label: 'Alerts', value: '2', detail: 'Low priority', tone: 'orange' },
    ],
    columns: [
      { key: 'name', label: 'Device' },
      { key: 'serial', label: 'Serial' },
      { key: 'room', label: 'Room' },
      { key: 'lastSeen', label: 'Last seen' },
      { key: 'status', label: 'Status' },
    ],
    rows: [
      { id: 'd1', name: 'North gate scanner', serial: 'ZK-NG-204', room: 'North gate', lastSeen: 'Just now', status: 'Online' },
      { id: 'd2', name: 'Level 2 scanner', serial: 'ZK-L2-112', room: 'Level 2', lastSeen: '2 min ago', status: 'Online' },
      { id: 'd3', name: 'Science lab scanner', serial: 'RF-SL-019', room: 'Lab 2', lastSeen: '48 min ago', status: 'Check-in needed' },
      { id: 'd4', name: 'East gate scanner', serial: 'ZK-EG-087', room: 'East gate', lastSeen: 'Yesterday', status: 'Offline' },
    ],
  },
  users: {
    module: 'users',
    title: 'Team access',
    eyebrow: 'People & permissions',
    description: 'Invite staff and maintain the right access for each responsibility.',
    endpoint: 'GET /api/users',
    apiPath: '/api/users',
    action: 'Invite team member',
    roles: ['Admin'],
    metrics: [
      { label: 'Active staff', value: '58', detail: 'Across all functions', tone: 'indigo' },
      { label: 'Teachers', value: '41', detail: '7 class leads', tone: 'cyan' },
      { label: 'Pending invites', value: '3', detail: 'Expiring this week', tone: 'violet' },
    ],
    columns: [
      { key: 'name', label: 'Team member' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
      { key: 'lastSeen', label: 'Last active' },
      { key: 'status', label: 'Status' },
    ],
    rows: [
      { id: 'u1', name: 'Maya Rahman', email: 'maya@coaching.local', role: 'Teacher', lastSeen: 'Just now', status: 'Active' },
      { id: 'u2', name: 'Farhana Islam', email: 'farhana@coaching.local', role: 'Teacher', lastSeen: '15 min ago', status: 'Active' },
      { id: 'u3', name: 'Rafiq Ahmed', email: 'rafiq@coaching.local', role: 'Accountant', lastSeen: 'Yesterday', status: 'Active' },
      { id: 'u4', name: 'Samia Karim', email: 'samia@coaching.local', role: 'Teacher', lastSeen: 'Invite sent', status: 'Pending' },
    ],
  },
};

export function hasRole(role: string | undefined, allowedRoles: CoachingRole[]): boolean {
  return !!role && allowedRoles.includes(role as CoachingRole);
}
