export interface AcademicClassSummary {
  classLevel: number;
  subjectCount: number;
  batchCount: number;
}

export interface AcademicSubject {
  id: string;
  classLevel: number;
  name: string;
  code: string;
}

export interface AcademicBatch {
  id: string;
  classLevel: number;
  name: string;
  code: string | null;
}

export interface CreateAcademicSubjectRequest {
  classLevel: number;
  name: string;
  code: string;
}

export interface CreateAcademicBatchRequest {
  classLevel: number;
  name: string;
  code: string | null;
}

export interface AcademicSetupSubjectInput {
  name: string;
  code: string;
}

export interface AcademicSetupBatchInput {
  name: string;
  code: string | null;
}

export interface SaveAcademicSetupRequest {
  classLevel: number;
  subjects: AcademicSetupSubjectInput[];
  batches: AcademicSetupBatchInput[];
}

export interface SaveAcademicSetupResponse {
  subjects: AcademicSubject[];
  batches: AcademicBatch[];
}
