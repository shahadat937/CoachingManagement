import { createFeature, createReducer, on } from '@ngrx/store';
import { Student } from '../data/student.models';
import { StudentsActions as A } from './students.actions';

export interface StudentsState {
  students: Student[];
  isActiveFilter: boolean;
  loading: boolean;
  saving: boolean;
  uploadingPhotoId: string | null;
  photoUrls: Record<string, string>;
  error: string | null;
  success: string | null;
}

const initialState: StudentsState = {
  students: [],
  isActiveFilter: true,
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
    on(A.load, (state, { isActive }) => ({
      ...state,
      students: [],
      photoUrls: {},
      isActiveFilter: isActive,
      loading: true,
      error: null,
    })),
    on(A.loadSuccess, (state, { students }) => ({ ...state, students, loading: false })),
    on(A.loadFailure, (state, { error }) => ({ ...state, loading: false, error })),
    on(A.create, (state) => ({ ...state, saving: true, error: null, success: null })),
    on(A.createSuccess, (state, { student }) => ({
      ...state,
      students: state.isActiveFilter && student.isActive
        ? [student, ...state.students.filter((item) => item.id !== student.id)]
        : state.students,
      saving: false,
      success: `${student.fullName} was added to the student directory.`,
    })),
    on(A.createFailure, (state, { error }) => ({ ...state, saving: false, error })),
    on(A.update, (state) => ({ ...state, saving: true, error: null, success: null })),
    on(A.updateSuccess, (state, { student }) => ({
      ...state,
      students: state.students.map((item) => item.id === student.id ? { ...item, ...student } : item),
      saving: false,
      success: `${student.fullName} was updated.`,
    })),
    on(A.updateFailure, (state, { error }) => ({ ...state, saving: false, error })),
    on(A.deactivate, (state) => ({ ...state, saving: true, error: null, success: null })),
    on(A.deactivateSuccess, (state, { student }) => {
      const photoUrls = { ...state.photoUrls };
      delete photoUrls[student.id];

      return {
        ...state,
        students: state.students.filter((item) => item.id !== student.id),
        photoUrls,
        saving: false,
        success: `${student.fullName} was made inactive. Their record was not erased.`,
      };
    }),
    on(A.deactivateFailure, (state, { error }) => ({ ...state, saving: false, error })),
    on(A.activate, (state) => ({ ...state, saving: true, error: null, success: null })),
    on(A.activateSuccess, (state, { student }) => {
      const photoUrls = { ...state.photoUrls };
      delete photoUrls[student.id];

      return {
        ...state,
        students: state.students.filter((item) => item.id !== student.id),
        photoUrls,
        saving: false,
        success: `${student.fullName} was reactivated and returned to the active directory.`,
      };
    }),
    on(A.activateFailure, (state, { error }) => ({ ...state, saving: false, error })),
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
