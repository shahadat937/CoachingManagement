import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { CreateStudentRequest, Student, StudentPhotoMetadata, UpdateStudentRequest } from '../data/student.models';

export const StudentsActions = createActionGroup({
  source: 'Students',
  events: {
    Load: emptyProps(),
    'Load Success': props<{ students: Student[] }>(),
    'Load Failure': props<{ error: string }>(),
    Create: props<{ request: CreateStudentRequest }>(),
    'Create Success': props<{ student: Student }>(),
    'Create Failure': props<{ error: string }>(),
    Update: props<{ studentId: string; request: UpdateStudentRequest }>(),
    'Update Success': props<{ student: Student }>(),
    'Update Failure': props<{ error: string }>(),
    'Upload Photo': props<{ studentId: string; photo: File }>(),
    'Upload Photo Success': props<{ studentId: string; metadata: StudentPhotoMetadata }>(),
    'Upload Photo Failure': props<{ studentId: string; error: string }>(),
    'Load Photo': props<{ studentId: string }>(),
    'Load Photo Success': props<{ studentId: string; objectUrl: string }>(),
    'Load Photo Failure': props<{ studentId: string }>(),
    'Clear Photo Urls': emptyProps(),
    'Clear Feedback': emptyProps(),
  },
});
