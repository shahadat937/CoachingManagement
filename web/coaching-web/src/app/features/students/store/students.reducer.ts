import { createFeature, createReducer, on } from '@ngrx/store';
import { Student } from '../data/student.models';
import { StudentsActions as A } from './students.actions';

export interface StudentsState {
  students: Student[];
  loading: boolean;
  saving: boolean;
  uploadingPhotoId: string | null;
  photoUrls: Record<string, string>;
  error: string | null;
  success: string | null;
}

const initialState: StudentsState = {
  students: [],
  loading: false,
  saving: false,
  uploadingPhotoId: null,
  photoUrls: {},
  error: null,
  success: null,
};

export const studentsFeature = createFeature({
  name: 'students',
  reducer: createReducer(
    initialState,
    on(A.load, (state) => ({ ...state, loading: true, error: null })),
    on(A.loadSuccess, (state, { students }) => ({ ...state, students, loading: false })),
    on(A.loadFailure, (state, { error }) => ({ ...state, loading: false, error })),
    on(A.create, (state) => ({ ...state, saving: true, error: null, success: null })),
    on(A.createSuccess, (state, { student }) => ({
      ...state,
      students: [student, ...state.students.filter((item) => item.id !== student.id)],
      saving: false,
      success: `${student.fullName} was added to the student directory.`,
    })),
    on(A.createFailure, (state, { error }) => ({ ...state, saving: false, error })),
    on(A.uploadPhoto, (state, { studentId }) => ({ ...state, uploadingPhotoId: studentId, error: null, success: null })),
    on(A.uploadPhotoSuccess, (state, { studentId, metadata }) => {
      const student = state.students.find((item) => item.id === studentId);
      return {
        ...state,
        students: state.students.map((item) => item.id === studentId
          ? { ...item, hasPhoto: true, photoUpdatedAt: metadata.updatedAt }
          : item),
        uploadingPhotoId: null,
        success: `The photo for ${student?.fullName ?? 'this student'} was saved.`,
      };
    }),
    on(A.uploadPhotoFailure, (state, { studentId, error }) => ({
      ...state,
      uploadingPhotoId: state.uploadingPhotoId === studentId ? null : state.uploadingPhotoId,
      error,
    })),
    on(A.loadPhotoSuccess, (state, { studentId, objectUrl }) => ({
      ...state,
      photoUrls: { ...state.photoUrls, [studentId]: objectUrl },
    })),
    on(A.clearPhotoUrls, (state) => ({ ...state, photoUrls: {} })),
    on(A.clearFeedback, (state) => ({ ...state, error: null, success: null })),
  ),
});

export const {
  selectStudents,
  selectLoading,
  selectSaving,
  selectUploadingPhotoId,
  selectPhotoUrls,
  selectError,
  selectSuccess,
} = studentsFeature;
