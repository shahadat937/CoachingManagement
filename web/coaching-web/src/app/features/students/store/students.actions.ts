import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { CreateStudentRequest, Student } from '../data/student.models';

export const StudentsActions = createActionGroup({
  source: 'Students',
  events: {
    Load: emptyProps(),
    'Load Success': props<{ students: Student[] }>(),
    'Load Failure': props<{ error: string }>(),
    Create: props<{ request: CreateStudentRequest }>(),
    'Create Success': props<{ student: Student }>(),
    'Create Failure': props<{ error: string }>(),
    'Clear Feedback': emptyProps(),
  },
});
