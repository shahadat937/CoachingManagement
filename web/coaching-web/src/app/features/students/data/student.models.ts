export interface Student {
  id: string;
  createdAt: string;
  studentNo: string;
  fullName: string;
  classLevel: number;
  guardianPhone: string;
  deviceUserId: string | null;
  hasPhoto: boolean;
  photoUpdatedAt: string | null;
}

export interface CreateStudentRequest {
  studentNo: string;
  fullName: string;
  classLevel: number;
  guardianPhone: string;
  deviceUserId?: string | null;
}

export interface UpdateStudentRequest {
  studentNo: string;
  fullName: string;
  classLevel: number;
  guardianPhone: string;
  deviceUserId?: string | null;
}

export interface StudentPhotoMetadata {
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  sizeBytes: number;
  updatedAt: string;
}
