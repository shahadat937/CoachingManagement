import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { AttendanceRow, AttendanceStatus } from '../data/attendance.models';

export const AttendanceActions = createActionGroup({
  source: 'Attendance',
  events: {
    'Load Session': props<{ sessionId: string }>(),
    'Load Session Success': props<{ sessionId: string; rows: AttendanceRow[] }>(),
    'Load Session Failure': props<{ error: string }>(),
    'Mark': props<{ sessionId: string; studentId: string; status: AttendanceStatus }>(),
    'Mark Success': props<{ studentId: string; status: AttendanceStatus }>(),
    'Mark Failure': props<{ error: string }>(),
    'Clear Error': emptyProps(),
  },
});
